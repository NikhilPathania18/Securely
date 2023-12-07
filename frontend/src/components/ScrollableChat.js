import { Avatar } from "@chakra-ui/avatar";
import { Tooltip } from "@chakra-ui/tooltip";
import ScrollableFeed from "react-scrollable-feed";
import { useState,useEffect } from "react";
import axios from "axios";
import { Stack } from "@chakra-ui/layout";
import { getSender } from "../config/ChatLogics";
import {
  getBase64FromEncryptedString,
  getEmailFromEncryptedString,
} from "../config/decoder";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  useDisclosure,
  FormControl,
  Input,
  useToast,
  Box,
  IconButton,
  Spinner,
  Text,
} from "@chakra-ui/react";
import { AttachmentIcon, ViewIcon, ArrowForwardIcon } from "@chakra-ui/icons";

import io from "socket.io-client";
import ChatLoading from "./ChatLoading";

import {
  isLastMessage,
  isSameSender,
  isSameSenderMargin,
  isSameUser,
} from "../config/ChatLogics";
import { ChatState } from "../Context/ChatProvider";

const ScrollableChat = ({ messages }) => {

  const ENDPOINT = "http://localhost:5000";
  
  // var socket, selectedChatCompare; 
  const [socket, setSocket] = useState(null)   
  const [loggedUser, setLoggedUser] = useState();
  // const { user } = ChatState();
  const toast = useToast();

  const { isOpen, onOpen, onClose } = useDisclosure();

  const [isFwdOpen, setFwdOpen] = useState(false);

  const [email, setEmail] = useState("");

  const [selectedImage, setSelectedImage] = useState(null)

  const [socketConnected, setSocketConnected] = useState(false);
  const [typing, setTyping] = useState(false);
  const [istyping, setIsTyping] = useState(false);

  // const [chats, setChats] = useState([])

  
  const { selectedChat, setSelectedChat, user, chats, setChats } = ChatState();
  console.log(chats)

  useEffect(() => {
    const newSocket = io(ENDPOINT);
    newSocket.emit("setup", user);
    newSocket.on("connected", () => setSocket(newSocket));
    
    // Clean up function to disconnect socket when component unmounts
    return () => {
      newSocket.disconnect();
    };
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ENDPOINT, user]);

  const fetchChats = async () => {
    // console.log(user._id);
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };

      const { data } = await axios.get("/api/chat", config);
      setChats(data);
    } catch (error) {
      toast({
        title: "Error Occured!",
        description: "Failed to Load the chats",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom-left",
      });
    }
  };

  const sendMessage = async (selChat) => {
      console.log('chat id ', selChat._id)
      socket.emit("stop typing", selChat._id);
      try {
        const config = {
          headers: {
            "Content-type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
        };
        setSelectedImage(null);
        const { data } = await axios.post(
          "/api/message",
          {
            content:selectedImage,
            chatId: selChat,
          },
          config
        );
      } catch (error) {
        console.log(error)
        toast({
          title: "Error Occured!",
          description: "Failed to send the Message",
          status: "error",
          duration: 5000,
          isClosable: true,
          position: "bottom",
        });
      }
  };

  



  return (
    <ScrollableFeed>
      {
        <Modal size="sm" onClose={onClose} isOpen={isOpen} isCentered>
          <ModalOverlay />
          <ModalContent h="410px">
            <ModalCloseButton />
            <ModalBody
              d="flex"
              flexDir="column"
              alignItems="center"
              justifyContent="center"
            >
              <Text
                fontSize={{ base: "28px", md: "30px" }}
                fontFamily="Work sans"
                style={{ margin: "auto" }}
              >
                <span style={{ fontWeight: "bold" }}>
                  Email of the original author:
                </span>{" "}
                {email}
              </Text>
            </ModalBody>
            <ModalFooter>
              <Button
                onClick={() => {
                  onClose();
                }}
              >
                Close
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      }
      {
        <Modal
          size="sm"
          onClose={() => {
            setFwdOpen(false);
          }}
          isOpen={isFwdOpen}
          isCentered
        >
          <ModalOverlay />
          <ModalContent h="410px">
            <ModalCloseButton />
            <ModalBody
              d="flex"
              flexDir="column"
              alignItems="center"
              justifyContent="center"
            >
              {/* <Text
              fontSize={{ base: "28px", md: "30px" }}
              fontFamily="Work sans"
              style = {{margin: "auto"}}
            >
              <span style={{fontWeight: "bold"}}>Email of the original author:</span> {email}
            </Text> */}
              {
                "Forward To"
              }
              {chats ? (
                <Stack overflowY="scroll">
                  {chats.map((chat) => (
                    <Box
                      onClick={async() => { await sendMessage(chat); setSelectedChat(chat)}}
                      cursor="pointer"
                      bg={selectedChat === chat ? "#38B2AC" : "#E8E8E8"}
                      color={selectedChat === chat ? "white" : "black"}
                      px={3}
                      py={2}
                      borderRadius="lg"
                      key={chat._id}
                    >
                      <Text>
                        {!chat.isGroupChat
                          ? getSender(loggedUser, chat.users)
                          : chat.chatName}
                      </Text>
                      {chat.latestMessage && (
                        <Text fontSize="xs">
                          <b>{chat.latestMessage.sender.name} : </b>
                          {chat.latestMessage.content.length > 500
                            ? "Image"
                            : chat.latestMessage.content.length > 50
                            ? chat.latestMessage.content.substring(0, 51) +
                              "..."
                            : chat.latestMessage.content}
                        </Text>
                      )}
                    </Box>
                  ))}
                </Stack>
              ) : (
                <ChatLoading />
              )}
            </ModalBody>
            <ModalFooter>
              <Button
                onClick={() => {
                  setFwdOpen(false);
                }}
              >
                Close
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      }
      {messages &&
        messages.map((m, i) => (
          <div style={{ display: "flex" }} key={m._id}>
            {(isSameSender(messages, m, i, user._id) ||
              isLastMessage(messages, i, user._id)) && (
              <Tooltip label={m.sender.name} placement="bottom-start" hasArrow>
                <Avatar
                  mt="7px"
                  mr={1}
                  size="sm"
                  cursor="pointer"
                  name={m.sender.name}
                  src={m.sender.pic}
                />
              </Tooltip>
            )}
            <span
              style={{
                backgroundColor: `${
                  m.sender._id === user._id ? "#BEE3F8" : "#B9F5D0"
                }`,
                marginLeft: isSameSenderMargin(messages, m, i, user._id),
                marginTop: isSameUser(messages, m, i, user._id) ? 3 : 10,
                borderRadius: "20px",
                padding: "5px 15px",
                maxWidth: "75%",
              }}
            >
              {m.content.length > 500 && (
                <>
                  <div
                    id="nikhil"
                    style={{
                      display: "flex",
                      width: "300px",
                      alignItems: "center",
                      justifyContent: "center",
                      position: "relative",
                    }}
                  >
                    <IconButton
                      style={{
                        width: "20px",
                        marginRight: "3px",
                        position: "absolute",
                        top: "0",
                        right: "0",
                      }}
                      icon={<ViewIcon />}
                      onClick={() => {
                        onOpen();
                        setEmail(getEmailFromEncryptedString(m.content));
                      }}
                    />
                    <img
                      src={`${getBase64FromEncryptedString(m.content)}`}
                      alt="Image"
                    />
                  </div>
                  <IconButton
                    icon={<ArrowForwardIcon />}
                    aria-label="Forward"
                    onClick={() => {
                      setSelectedImage(m.content)
                      setFwdOpen(true);
                    }}
                    title="Forward"
                    style={{ display: "block", margin: "auto" }}
                  />
                </>
              )}
              {m.content.length <= 500 && <>{m.content}</>}
            </span>
          </div>
        ))}
    </ScrollableFeed>
  );
};

export default ScrollableChat;

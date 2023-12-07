export const getBase64FromEncryptedString = (input) => {

    try {
        let arr = input.split('*')
        return arr[0]
    } catch (error) {
        console.log(error)
    }
}

export const getEmailFromEncryptedString = (input) => {
    try {
        let arr = input.split('*')
        if(arr.length>1)    return arr[1]
        else    return "";
    } catch (error) {
        console.log(error)
    }
}
export const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
}

export const getValidationEmailMessage = (email) => {
    if (!email) return ""
    if (!isValidEmail(email)) {
        return "Please enter a valid email (e.g:user@example.com)"
    }
    return ""
}

export const isValidUsername = (username) => {
    const usernameRegex = /^[a-zA-Z0-9_-]{3,}$/
    return usernameRegex.test(username)
}

export const isValidInput = (input) => {
    return isValidEmail(input) || isValidUsername(input)
}

export const getValidationMessage = (input) => {
    if (!input) return ""
    if (!isValidInput(input)) {
        return "Please enter a valid email (e.g: user@example.com) or username (minimum 3 characters, containing letters/numbers/underscores/hyphens)"
    }
    return ""
}

// Validate password strength
export const isValidPassword = (password) => {
    // At least 8 characters
    return password.length >= 8
}

export const getPasswordValidationMessage = (password) => {
    if (!password) return ""
    if (!isValidPassword(password)) {
        return "Password must be at least 8 characters long"
    }
    return ""
}

// Check if passwords match
export const doPasswordsMatch = (password, confirmPassword) => {
    if (!password || !confirmPassword) return true 
    return password === confirmPassword
}

export const getPasswordMatchMessage = (password, confirmPassword) => {
    if (!password || !confirmPassword) return ""
    if (!doPasswordsMatch(password, confirmPassword)) {
        return "Passwords do not match"
    }
    return ""
}

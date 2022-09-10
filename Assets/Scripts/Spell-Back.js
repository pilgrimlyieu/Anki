function clear(word) {
    if (word.slice(1, 2) == ':')
        return word.slice(2).replace(/_/g, '')
    else
        return word
}

document.getElementById('hint').innerHTML = clear(word)

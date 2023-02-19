function clear(word) {
    let flag = word.charAt(0)
    if (flag == ':' || flag == '-' || flag == '#')
        return word.slice(1).replace(/_/g, '').replace(/\?/g, '')
    else
        return word.replace(/\?/g, '')
}

document.getElementById('hint').innerHTML = clear(word)

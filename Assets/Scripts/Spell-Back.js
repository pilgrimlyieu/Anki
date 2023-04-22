function clear(word) {
    let flag = word.charAt(0)
    if (flag === ':' || flag === '-' || flag === '#' || flag === '!')
        return word.slice(1).replace(/_/g, '')
    else
        return word
}

document.getElementById('hint').innerHTML = clear(word).replace(/\?/g, '')

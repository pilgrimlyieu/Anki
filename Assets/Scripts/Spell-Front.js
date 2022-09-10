var cloze_alls = ['in', 'of', 'from', 'at', 'on', 'through', 'via', 'before', 'after', 'until', 'to', 'down', 'up', 'off', 'away', 'into', 'onto', 'upon', 'out', 'with', 'without', 'within', 'by', 'for', 'since', 'toward', 'towards', 'forward', 'forwards', 'above', 'below', 'beyond', 'about', 'under', 'beneath', 'during', 'over', 'beside', 'behind', 'as', 'and', 'or', 'though', 'but', 'not', 'nor', 'either', 'neither', 'yet', 'both', 'so', 'such', 'that', 'which', 'when', 'how', 'what', 'a', 'an', 'the', 'this', 'that', 'if', 'no', 'most', 'one', 'one\'s', 'oneself', 'do', 'does', 'doing', 'did', 'done', 'be', 'is', 'are', 'was', 'were', 'been', 'many', 'much', 'can', 'can\'t', 'sb\'s']
var remain_alls = ['sth.', 'sb.', '...']
var default_underline = '__'
var all_same = 1

function core(word) {
    let left = 0
    let right = 0
    if (word.slice(0) == '(') {
        left = 1
        word = word.slice(1)
    }
    if (word.slice(-1) == ')') {
        right = 1
        word = word.slice(0, -1)
    }
    return [word, left, right]
}

function underline_replace(length, first = 0) {
    if (length <= 1)
        return ''
    else if (all_same)
        return default_underline
    else
        return '_'.repeat(Math.round((length + (first ? 0.5 : 1))/ 2.1))
}

var over = 1
if (word.slice(1, 2) == ':') {
    over = 0
    let flag = word.slice(0, 1)
    if (flag == ';') {
        all_same = 0
        let params = word.slice(2).split('_')
        for (const order in params) {
            const param = params[order]
            if (order % 2)
                result += underline_replace(param.length)
            else
                result += param
        }
    }
    else if (flag == ':') {
        all_same = 1
        let params = word.slice(2).split('_')
        for (const order in params) {
            const param = params[order]
            if (order % 2)
                result += underline_replace(param.length)
            else
                result += param
        }
    }
    else if (flag == '-') {
        all_same = 0
        let params = word.slice(2).split(' ')
        for (const order in params)
            result += underline_replace(params[order].length) + ' '
    }
    else if (flag == '_') {
        all_same = 1
        let params = word.slice(2).split(' ')
        for (const order in params)
            result += underline_replace(params[order].length) + ' '
    }
    else if (flag == '0') {
        all_same = 0
        over = 1
        words = word.slice(2).split(' ')
    }
    else if (flag == '1') {
        all_same = 1
        over = 1
        words = word.slice(2).split(' ')
    }
}
if (over) {
    for (const order in words) {
        const word = words[order]
        const word_core = core(word)
        let core_word = word_core[0]
        let left = word_core[1]
        let right = word_core[2]
        if (cloze_alls.includes(core_word))
            result += (left ? '(' : '') + default_underline + (right ? ')' : '')
        else if (remain_alls.includes(core_word))
            result += word
        else if (core_word.includes('/')) {
            let w = word.split('/')
            let temp = ''
            for (const o in w) {
                const ww = w[o]
                temp += (cloze_alls.includes(ww) ? default_underline : ww.charAt(0) + underline_replace(ww.length, 1)) + '/'
            }
            result += temp.slice(0, -1) + (right ? ')' : '')
        }
        else
            result += word.charAt(0) + underline_replace(core_word.length - right, 1) + (right ? ')' : '')
        result += ' '
    }
}

document.getElementById('hint').innerHTML = result

var cloze_alls = ['in', 'of', 'from', 'at', 'on', 'through', 'via', 'before', 'after', 'until', 'to', 'down', 'up', 'off', 'away', 'into', 'onto', 'upon', 'out', 'with', 'without', 'within', 'by', 'for', 'since', 'toward', 'towards', 'forward', 'forwards', 'above', 'below', 'beyond', 'about', 'under', 'beneath', 'during', 'over', 'beside', 'behind', 'as', 'and', 'or', 'though', 'but', 'not', 'nor', 'either', 'neither', 'yet', 'both', 'so', 'such', 'that', 'which', 'when', 'how', 'what', 'a', 'an', 'the', 'this', 'that', 'if', 'no', 'most', 'one', 'one\'s', 'oneself', 'do', 'does', 'doing', 'did', 'done', 'be', 'is', 'are', 'was', 'were', 'been', 'many', 'much', 'can', 'can\'t', 'sb\'s', 'back', 'there', 'there\'s', 'it', 'things', 'ever']
var remain_alls = ['sth.', 'sb.', '...']
var default_underline = '__'

function underline_replace(word, first = 1) {
    return (word.length <= 1 ? '' : (first ? word.charAt(0) : '') + default_underline)
}

// var word = "abc ..., fsafsa".trim()
// var words = word.split(' ')
// var result = ''

var flag = word.charAt(0)
if (flag == ':') {
    let params = word.slice(1).split('_')
    for (const order in params) {
        const param = params[order]
        if (order % 2)
            result += underline_replace(param, 0)
        else
            result += param
    }
}
else if (flag == '-') {
    let params = word.replace(/\?/, default_underline).slice(1).split(' ')
    for (const order in params)
        result += underline_replace(params[order], 0) + ' '
}
else {
    for (const order in words) {
        const word = words[order]
        let left = word.charAt(0) == '('
        let right = word.charAt(word.length - 1) == ')'
        let comma = word.charAt(word.length - 1) == ','
        let core_word = word.slice(left, word.length - (right || comma))
        if (cloze_alls.includes(core_word.toLowerCase()))
            result += (left ? '(' : '') + default_underline + (right ? ')' : comma ? ',' : '')
        else if (remain_alls.includes(core_word.toLowerCase()))
            result += word
        else if (core_word.includes('/')) {
            let w = word.split('/')
            let temp = ''
            for (const o in w) {
                const ww = w[o]
                if (remain_alls.includes(ww))
                    temp += ww
                else
                    temp += (cloze_alls.includes(ww) ? default_underline : underline_replace(ww))
                temp += '/'
            }
            result += temp.slice(0, -1) + (right ? ')' : comma ? ',' : '')
        }
        else
            result += underline_replace(core_word.slice(0, core_word.length - right)) + (right ? ')' : comma ? ',' : '')
        result += ' '
    }
}

document.getElementById('hint').innerHTML = result.replace(/\?/g, default_underline)

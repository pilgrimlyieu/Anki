var cloze_alls = ['?', 'in', 'of', 'from', 'at', 'on', 'through', 'via', 'before', 'after', 'until', 'to', 'down', 'up', 'off', 'away', 'into', 'onto', 'upon', 'out', 'with', 'without', 'within', 'by', 'for', 'since', 'toward', 'towards', 'forward', 'forwards', 'above', 'below', 'beyond', 'again', 'about', 'under', 'beneath', 'during', 'around', 'than', 'over', 'beside', 'behind', 'as', 'and', 'or', 'though', 'but', 'not', 'nor', 'either', 'neither', 'yet', 'both', 'so', 'such', 'that', 'which', 'when', 'how', 'what', 'a', 'an', 'the', 'this', 'that', 'if', 'no', 'most', 'one', 'one\'s', 'oneself', 'do', 'does', 'doing', 'did', 'done', 'be', 'is', 'are', 'was', 'were', 'been', 'many', 'much', 'can', 'can\'t', 'sb\'s', 'back', 'there', 'there\'s', 'it', 'it\'s', 'other', 'else', 'among', 'against', 'things', 'ever', 'something', 'everything', 'anything', 'i', 'me', 'my', 'we', 'us', 'our', 'you', 'your', 'he', 'him', 'his', 'she', 'her', 'they', 'them', 'their', 'whether', 'whose', 'very', 'other', 'others', 'another', 'upside']
var remain_alls = ['sth.', 'sb.', 'sp.', '...']
var punctuations = [',', '.', ')']
var default_underline = '__'

function underline_replace(word, first = 1) {
    return word ? ((first && word.length > 1) ? word.charAt(0) : '') + default_underline : ''
}

// var word = "over and over(again)".trim()
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
    let params = word.slice(1).split(' ')
    for (const order in params)
        result += underline_replace(params[order], 0) + ' '
}
else if (flag == '#') {
    result = default_underline.repeat(2)
}
else {
    for (const order in words) {
        const word = words[order]
        let left = word.charAt(0) == '('
        let suff = word.charAt(word.length - 1)
        let punc = punctuations.includes(suff) ? suff : ''
        let pre_word = left ? word.slice(1, word.length) : word
        let core_word = (remain_alls.includes(pre_word) || pre_word.includes('/')) ? pre_word : pre_word.slice(0, pre_word.length - (punc != ''))
        if (cloze_alls.includes(core_word.toLowerCase()))
            result += (left ? '(' : '') + default_underline + punc
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
            result += temp.slice(0, -1) + punc
        }
        else
            result += (left ? '(' : '') + underline_replace(core_word.slice(0, core_word.length - (punc != ''))) + punc
        result += ' '
    }
}

document.getElementById('hint').innerHTML = result
// console.log(result);

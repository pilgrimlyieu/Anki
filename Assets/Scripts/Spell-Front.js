// Created by New Bing, Maintained & Developed by PilgrimLyieu

// var word = "due to sb's constant efforts".trim()
// var words = word.split(" ")
// var result = ""

var hiddenWords = ["?", "in", "of", "from", "at", "on", "through", "via", "before", "after", "until", "to", "down", "up", "off", "away", "into", "onto", "upon", "out", "with", "without", "within", "by", "for", "since", "toward", "towards", "forward", "forwards", "above", "below", "beyond", "again", "about", "under", "beneath", "during", "around", "than", "over", "beside", "behind", "as", "and", "or", "though", "but", "not", "nor", "either", "neither", "yet", "both", "so", "such", "that", "which", "when", "how", "what", "a", "an", "the", "this", "that", "if", "no", "most", "one", "one's", "oneself", "do", "does", "doing", "did", "done", "be", "is", "are", "was", "were", "been", "many", "much", "can", "can't", "sb.'s", "sb's", "back", "there", "there's", "it", "it's", "other", "else", "among", "against", "things", "ever", "something", "everything", "anything", "i", "me", "my", "we", "us", "our", "you", "your", "he", "him", "his", "she", "her", "they", "them", "their", "whether", "whose", "very", "other", "others", "another", "upside", "should", "only", "ahead", "throughout", "once", "all", "b"]
var preservedWords = ["sth", "sb", "sp"]
var underline = "__";
var partword = "";
var instruction = word[0];

if ([":", "-", "!", "#"].includes(instruction)) {
    word = word.slice(1)
} else {
    instruction = null
}

if (instruction === "#") {
    result = underline.repeat(2);
} else if (instruction === ":") {
    let params = word.split("_")
    for (const order in params) {
        const param = params[order]
        if (order % 2) {
            result += param ? underline : ""
        } else {
            result += param
        }
    }
} else if (instruction === "-") {
    let params = word.split(" ")
    for (const order in params) {
        result += underline + " "
    }
} else if (instruction === "!") {
    let params = word.split(" ")
    for (const order in params) {
        result += params[order][0] + underline + " "
    }
} else {
    for (let i = 0; i < word.length; i++) {
        let char = word[i];
        if (/[-\w'?]/.test(char)) {
            partword += char;
        } else {
            // if (partword) {
            if (hiddenWords.includes(partword.toLowerCase())) {
                result += underline;
            } else if (preservedWords.includes(partword)) {
                result += partword;
            } else if (partword.length > 1 && !(/^\d/.test(partword))) {
                result += partword[0] + underline;
            } else {
                result += partword;
            }
            partword = "";
            // }
            result += char;
        }
    }
    if (partword) {
        if (hiddenWords.includes(partword.toLowerCase())) {
            result += underline;
        } else if (preservedWords.includes(partword)) {
            result += partword;
        } else if (partword.length > 1 && !(/^\d/.test(partword))) {
            result += partword[0] + underline;
        } else {
            result += partword;
        }
    }
}

document.getElementById("hint").innerHTML = result
// console.log(result);

/* promts
我想要一个这样的功能，你可以帮我通过 JavaScript 实现吗？是要将原始文本进行处理，得到处理文本，目标如下。

1. 有一个隐藏词表（后称 A），对于此词表内全部单词，若在原始文本中作为单词出现（即前后都为空格），那么替换为一定长度的下划线（下划线长度统一设置，下文同。为方便行文用长度为一的下划线「_」示例）。如 abc 在 A 中，那么「abc」处理为「_」
2. 有一个保留词表（后称 B），对词表内全部单词，保留原始文本内出现的单词。如 def 在 B 中，那么「def」处理为「def」
3. 对于剩下的单词，如果单词长度大于 1，那么保留首字母，并加入一定长度下划线。如 ghi 既不在 A 中也不再 B 中，则「ghi」处理为「g_」
4. 对于数字开头的内容，一律保留。如「60」处理为「60」，「60km」处理为「60km」
5. 以「,」「.」等标点符号结尾的，将除标点外内容按上面内容处理，标点保留。如「abc.」处理为「_.」，「60km,」处理为「60km,」
6. 对于斜杠分割的内容，将斜杠分割的多个部分视为多个单词依照上面内容进行处理。如「abc/def/60km/ghi.」处理为「_/def/60km/g_.」
7. 有括号的内容，将括号内的内容按上面规则进行处理，并保留括号。如「(abc/def/60km/ghi. abc def ghi 60km abc. ghi, def)」处理为「(_/def/60km/g_. _ def g_ 60km _. g_, def)」
8. 处理文本前如果有指令符「:」（注意，指令符至多只能有一个出现），则根据文本内容的「_」进行分割，不再遵循上面的内容，同时结果不包括指令符。如「:_(abc/def_/60km/_ghi. abc def ghi) 60k_m ab_c. gh_i, def」处理为「_/60km/_m ab_i, def」
9. 处理文本前如果有指令符「-」，则忽略隐藏词表与保留词表，按照目标 3 进行处理（但是目标 4~7 还是要满足），同时结果不包括指令符。如「-(abc/def/60km/ghi. abc def ghi) 60km abc. ghi, def」处理为「-(a_/d_/60km/g_. a_ d_ g_) 60km a_. g_, d_」
10. 处理文本前如果有指令符「#」，则将整个内容替换为设定下划线长度的两倍，同时结果不包括指令符。如「#(abc/def/60km/ghi. abc def ghi) 60km abc. ghi, def」处理为「__」

同时可以为每个目标提供一个我给予的样例的测试和你自己创造的复杂样例的测试吗？
*/

// // 目标 1
// console.log(processText('abc', hiddenWords, preservedWords, underlineLength)); // 输出 "__"

// // 目标 2
// console.log(processText('def', hiddenWords, preservedWords, underlineLength)); // 输出 "def"

// // 目标 3
// console.log(processText('ghi', hiddenWords, preservedWords, underlineLength)); // 输出 "g__"

// // 目标 4
// console.log(processText('60km', hiddenWords, preservedWords, underlineLength)); // 输出 "60km"

// // 目标 5
// console.log(processText('abc. 60km,', hiddenWords, preservedWords, underlineLength)); // 输出 "__. 60km,"

// // 目标 6
// console.log(processText('abc/def/60km/ghi.', hiddenWords, preservedWords, underlineLength)); // 输出 "__/def/60km/g__."

// // 目标 7
// console.log(processText('#(abc/def/60km/ghi. abc def ghi 60km abc. ghi, def)', hiddenWords, preservedWords, underlineLength)); // 输出 "(__/def/60km/g__. __ def g__ 60km __. g__, def)"

// // 目标 8
// console.log(processText(':(a_b_c/def/60km/ghi. abc def ghi 60km abc. ghi, def)', hiddenWords, preservedWords, underlineLength));

// // 目标 9
// console.log(processText('-(abc/def/60km/ghi. abc def ghi) 60km abc. ghi, def', hiddenWords, preservedWords, underlineLength)); // 输出 "-(a__/d__/60km/g__. a__ d__ g__) 60km a__. g__, d__"

// // 目标 10
// console.log(processText('(abc/def/60km/ghi. abc def ghi) 60-km abc. ghi, d-ef', hiddenWords, preservedWords, underlineLength)); // 输出 "(__/def/60km/g__. __ def g__) 60-km __. g__, d-ef"

[].forEach.call(document.querySelectorAll('.cloze'),
    function(V0) {
        let hint = V0.innerHTML.match(/\[(.+)\]/)[1];
        if (hint === "s") {
            V0.innerHTML = "&nbsp;&nbsp"
        } else if (hint === "...") {
            V0.innerHTML = "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"
        } else if (hint === "@auto_phrase") {
            V0.innerHTML = "&nbsp;&nbsp;&nbsp;&nbsp;〔" + auto_phrase(V0.dataset.cloze.replace(/<.+?>/g, "")) + "〕&nbsp;&nbsp;&nbsp;&nbsp;"
        } else if (hint === "@auto_spell") {
            V0.innerHTML = "<span style='display:inline-block; text-decoration: none;'>〔" + auto_spell(V0.dataset.cloze.replace(/<.+?>/g, "")) + "〕</span>"
        } else if (hint === "@auto_spell_custom") {
            V0.innerHTML = "<span style='display:inline-block; text-decoration: none;'>〔" + auto_spell(V0.dataset.cloze.replace(/<.+?>/g, ""), ":") + "〕</span>"
        } else if (hint === "@auto_spell_one") {
            V0.innerHTML = "<span style='display:inline-block; text-decoration: none;'>〔" + auto_spell(V0.dataset.cloze.replace(/<.+?>/g, ""), "#") + "〕</span>"
        } else if (hint === "@auto_spell_all") {
            V0.innerHTML = "<span style='display:inline-block; text-decoration: none;'>〔" + auto_spell(V0.dataset.cloze.replace(/<.+?>/g, ""), "-") + "〕</span>"
        } else if (hint === "@auto_spell_wide") {
            V0.innerHTML = "<span style='display:inline-block; text-decoration: none;'>〔" + auto_spell(V0.dataset.cloze.replace(/<.+?>/g, ""), "!") + "〕</span>"
        } else {
            V0.innerHTML = "&nbsp;&nbsp;&nbsp;&nbsp;〔" + hint + "〕&nbsp;&nbsp;&nbsp;&nbsp;"
        }
    });

function auto_phrase(phrase) {
    let neglectWords = ["sth.", "sb.", "sp.", "...", "?", "in", "of", "from", "at", "on", "through", "via", "before", "after", "until", "to", "down", "up", "off", "away", "into", "onto", "upon", "out", "with", "without", "within", "by", "for", "since", "toward", "towards", "forward", "forwards", "above", "below", "beyond", "again", "about", "under", "beneath", "during", "around", "than", "over", "beside", "behind", "as", "and", "or", "though", "but", "not", "nor", "either", "neither", "yet", "both", "so", "such", "that", "which", "when", "how", "what", "a", "an", "the", "this", "that", "if", "no", "most", "one", "one's", "oneself", "be", "is", "are", "was", "were", "been", "many", "much", "can", "can't", "back", "there", "there's", "it", "it's", "other", "else", "among", "against", "things", "ever", "something", "everything", "anything", "i", "me", "my", "we", "us", "our", "you", "your", "he", "him", "his", "she", "her", "they", "them", "their", "whether", "whose", "very", "other", "others", "another", "upside", "should", "only", "ahead", "throughout", "b", "once", "all"]
    words = phrase.split(" ")
    for (order in words) {
        if (neglectWords.includes(words[order].toLowerCase()))
            continue
        return words[order].toLowerCase()
    }
    return words[0].toLowerCase()
}

function auto_spell(word, instruction = null) {
    let hiddenWords = ["?", "in", "of", "from", "at", "on", "through", "via", "before", "after", "until", "to", "down", "up", "off", "away", "into", "onto", "upon", "out", "with", "without", "within", "by", "for", "since", "toward", "towards", "forward", "forwards", "above", "below", "beyond", "again", "about", "under", "beneath", "during", "around", "than", "over", "beside", "behind", "as", "and", "or", "though", "but", "not", "nor", "either", "neither", "yet", "both", "so", "such", "that", "which", "when", "how", "what", "a", "an", "the", "this", "that", "if", "no", "most", "one", "one's", "oneself", "do", "does", "doing", "did", "done", "be", "is", "are", "was", "were", "been", "many", "much", "can", "can't", "sb's", "back", "there", "there's", "it", "it's", "other", "else", "among", "against", "things", "ever", "something", "everything", "anything", "i", "me", "my", "we", "us", "our", "you", "your", "he", "him", "his", "she", "her", "they", "them", "their", "whether", "whose", "very", "other", "others", "another", "upside", "should", "only", "ahead", "throughout", "once", "all", "b", "still", "what's", "aside", "some", "each"]
    let preservedWords = ["sth", "sb", "sp", "br"]
    let underline = "__";
    let partword = "";
    let result = ""

    if (![":", "-", "!", "#"].includes(instruction))
        instruction = null

    if (instruction === "#") {
        return underline.repeat(2);
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
        return result
    } else if (instruction === "-") {
        let params = word.split(" ")
        for (const order in params) {
            result += underline + " "
        }
        return result
    } else if (instruction === "!") {
        hiddenWords = []
        preservedWords = []
    }

    for (let i = 0; i < word.length; i++) {
        let char = word[i];
        if (/[-\w'?]/.test(char)) {
            partword += char;
        } else {
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
    return result
}

var showQuestionType = '1'

function showBackOptions() {
    var _isNormalOption = isNormalOption()
    var correctClass = _isNormalOption ? 'correct' : 'correct-light'
    var wrongClass = _isNormalOption ? 'wrong' : 'wrong-light'
    var shouldSelectClass = _isNormalOption ? 'should-select' : 'should-select-light'
    var optionObjs = getOptionObjs()
    var liList = ''
    var isMulti = ANSWER.indexOf('||') > 0
    for (var i in optionObjs) {
        var _optionObj = optionObjs[i]
        var _option = _optionObj.label
        var _optionKey = _optionObj.key + ''
        var _isSelected = isSelected(_optionKey)
        var _isCorrect = isCorrectAnswer(_optionKey)
        var _class = ''
        if (isMulti) {
            if (_isSelected && _isCorrect) {
                _class = 'option ' + correctClass
            } else if (!_isSelected && _isCorrect) {
                _class = 'option ' + shouldSelectClass
            } else if (_isSelected && !_isCorrect) {
                _class = 'option ' + wrongClass
            } else {
                _class = 'option'
            }
        } else {
            if (_isCorrect) {
                _class = 'option ' + correctClass
            } else {
                _class = _isSelected ? 'option ' + wrongClass : 'option'
            }
        }
        liList += "<li class='" + _class + "'>" + _option + "</li>"
    }
    document.getElementById("back-options").innerHTML = liList
}

function isCorrectAnswer(optionKey) {
    return ANSWER.indexOf(optionKey) > -1
}

function isSelected(optionKey) {
    if (!Persistence.isAvailable()) {
        return false
    }
    return (Persistence.getItem('ANKI-SELECTED') || '').indexOf(optionKey) > -1
}

function getOptionObjs() {
    var optionArray = OPTION.trim().split("||")
    var optionObjs = []
    for (var i in optionArray) {
        optionObjs.push({
            key: Number.parseInt(i) + 1,
            label: optionArray[i]
        })
    }
    if (Persistence.isAvailable()) {
        var optionsOrder = (Persistence.getItem('ANKI-OPTIONS-ORDER') || '').trim().split(',')
        optionObjs = optionObjs.sort(function(a, b) {
            return optionsOrder.indexOf(a.key + '') - optionsOrder.indexOf(b.key + '')
        })
    }
    return optionObjs
}

function isNormalOption() {
    if (Persistence.isAvailable()) {
        return Persistence.getItem('ANKI-SETTINGS-NORMAL-OPTIONS') === '1'
    } else {
        return false
    }
}

function showTags() {
    var tags = TAGS.trim()
    if (!tags) return
    tags = tags.split(' ')
    var tagList = '<span class="tag-title">标签: </span>'
    for (var tag of tags) {
        if (tag) {
            tagList += '<span class="single-tag">' + tag + '</span>'
        }
    }
    document.getElementById("back-tag").innerHTML = tagList
}

function numberToAlpha(numbers) {
    var optionsOrder = []
    if (Persistence.isAvailable()) {
        optionsOrder = Persistence.getItem('ANKI-OPTIONS-ORDER').trim().split(',')
    }
    var alphas = []
    for (var i in numbers) {
        var number = numbers[i]
        if (number) {
            if (optionsOrder.length === 0) {
                alphas.push(String.fromCharCode(Number.parseInt(number) + 64))
            } else {
                alphas.push(String.fromCharCode(optionsOrder.indexOf(number) + 65))
            }
        }
    }
    alphas.sort()
    return alphas.toString()
}

function showAnswers() {
    var correctAnswers = numberToAlpha(ANSWER.trim().split('||'))
    var yourChoice = '未选择'
    if (Persistence.isAvailable()) {
        var selectedNumbers = (Persistence.getItem('ANKI-SELECTED') || '').trim().split(',')
        yourChoice = numberToAlpha(selectedNumbers)
        Persistence.setItem('ANKI-SELECTED', '')
        var showQuestionType = Persistence.getItem('ANKI-SETTINGS-SHOW-QUESTION-TYPE') || '0'
        if (showQuestionType === '1') {
            document.getElementById('questionType').innerHTML = ANSWER.indexOf('||') > -1 ? '（多选）' : '（单选）'
        } else {
            document.getElementById('questionType').innerHTML = ANSWER.indexOf('||') > -1 ? '（多选）' : '（单选）' //PATCH: 原始为 ' '
        }
    }
    document.getElementById('tips').innerHTML = '<span style="color:white">正确选项：' + correctAnswers + '&nbsp;&nbsp;&nbsp;&nbsp;你的选项：' + yourChoice
}

function showNotes() {
    if (document.getElementsByClassName('notes-container')[0].innerHTML) {
        document.getElementById('notes-wrapper').style.display = 'block'
        var totalHeight = window.innerHeight
        var left = totalHeight - document.getElementsByClassName('wrap-container')[0].clientHeight - 140
        if (left < 80) {
            left = 80
        }
        var noteContainer = document.getElementsByClassName('notes-container')[0]
        noteContainer.style.maxHeight = left + 'px'
        noteContainer.style.display = 'block'
        document.getElementsByClassName('notes-button-container')[0].style.display = 'none'
    }
}

function showNoteButton() {
    if (document.getElementsByClassName('notes-container')[0].innerHTML) {
        document.getElementsByClassName('notes-button-container')[0].style.display = 'block'
        document.getElementById('notes-wrapper').style.display = 'block'
    }
}

function dealQuestionType(showQuestionType) {
    if (showQuestionType === '1') {
        document.getElementById('questionType').innerHTML = ANSWER.indexOf('||') > -1 ? '（多选）' : '（单选）'
    } else {
        document.getElementById('questionType').innerHTML = ' '
    }
}

showBackOptions()
showTags()
showAnswers()
dealQuestionType(showQuestionType)

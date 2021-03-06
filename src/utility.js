let tokenStrCache = []

export default {
    includesTokens(str, tokenStr) {
        str = str && str.toLowerCase();
        tokenStr = tokenStr && tokenStr.toLowerCase();

        let tokenStrRegex = tokenStrCache.filter(x => x.tokenStr === tokenStr)[0];
        if (!tokenStrRegex) {
            let quoteSplit = tokenStr.split('"');
            let regexParts = [];
            for (let i = 0; i < quoteSplit.length; i++) {
                let token = quoteSplit[i];
                if (token === "") continue;
                if (i % 2 === 1 && i !== quoteSplit.length - 1) {
                    // Quoted token, match entire quoted text, and it cannot be bordered by a word character
                    let prefix = /\w/.test(token[0]);
                    let suffix = /\w/.test(token[token.length - 1]);
                    token = this.escapeRegExp(token);
                    if (prefix) token = "(^|(?<=\\W))" + token;
                    if (suffix) token = token + "($|(?=\\W))";
                    regexParts.push(token);
                } else {
                    // Unquoted text, break up words, and it can be contained in another word
                    let tokens = token.split(" ").filter(x => x !== "");
                    tokens.forEach(tokenPart => regexParts.push(this.escapeRegExp(tokenPart)));
                }
            }
            tokenStrRegex = { tokenStr: tokenStr, regex: new RegExp(regexParts.join(".*"), "m") };
            tokenStrCache.push(tokenStrRegex);

            if (tokenStrCache.length > 20) tokenStrCache.shift();
        }

        return tokenStrRegex.regex.test(str);
    },
    escapeRegExp(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    },
    forEachAsync(array, fn, maxTimePerChunk, context) {
        return new Promise(resolve => {
            context = context || window;
            maxTimePerChunk = maxTimePerChunk || 100;
            var index = 0;

            function now() {
                return new Date().getTime();
            }

            function doChunk() {
                var startTime = now();
                while (index < array.length && (now() - startTime) <= maxTimePerChunk) {
                    // callback called with args (value, index, array)
                    fn.call(context, array[index], index, array);
                    ++index;
                }
                if (index < array.length) {
                    // set Timeout for async iteration
                    setTimeout(doChunk, 1);
                } else {
                    resolve();
                }
            }
            setTimeout(doChunk, 1);
        });
    },
    smoothScrollTo(element, to, duration) {
        let start = element.scrollTop;
        let difference = to - element.scrollTop;

        let soFar = 0;
        function scrollABit() {
            if (soFar >= duration) {
                element.scrollTop = to;
            } else {
                let percent = soFar / duration;
                let curve = (1 - Math.cos(Math.PI * percent)) / 2;
                element.scrollTop = difference * curve + start;
                soFar += 10;
                setTimeout(scrollABit, 10);
            }
        }
        scrollABit();
    },
    debounce(func, time = 100) {
        let timestamp = 0;
        let isTimeout = false;

        return function () {
            if (!isTimeout) {
                let currTimestamp = new Date().getTime();
                let timeDiff = currTimestamp - timestamp;
                if (timeDiff >= time) {
                    timestamp = currTimestamp;
                    func.apply(this, arguments);
                } else {
                    isTimeout = true;
                    setTimeout(() => {
                        timestamp = new Date().getTime();
                        func.apply(this, arguments);
                        isTimeout = false;
                    }, time - timeDiff);
                }
            }
        }
    },
    readText() {
        let input = document.createElement('input');
        input.setAttribute('type', 'file');
        input.setAttribute('style', 'display:none');
        document.body.append(input);
        return new Promise(resolve => {
            let fr = new FileReader();
            input.onchange = () => {
                fr.onload = x => resolve(x.target.result);
                fr.readAsText(input.files[0]);
            }
            input.click();
            input.remove();
        });
    },
    saveText(text, filename) {
        let a = document.createElement('a');
        a.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
        a.setAttribute('download', filename);
        a.click();
    }
}
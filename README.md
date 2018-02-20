# pdftotext-stdin
Beta / WIP: 
Make pdftotext read from stdin, output to FIFO (pdftotext doesn't want to be a duplex :c)

```bash
npm install --save pdftotext-stdin
```

```javascript
const extractor = require('pdftotext-stdin');

const rs = fs.createReadStream('my.pdf');

extractor.extractTextFromPdfStream(rs).then(text => {/*...*/});
```

See also [pdf-text-extract](https://www.npmjs.com/package/pdf-text-extract).

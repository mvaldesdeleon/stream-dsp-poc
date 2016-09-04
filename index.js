import lame from 'lame';
import Speaker from 'speaker';
import { createReadStream as sopen } from 'fs';
import { resolve } from 'path';
import { Transform } from 'stream';

const speaker = new Speaker({
    channels: 2,
    bitDepth: 16,
    sampleRate: 44100
});

const decoder = new lame.Decoder();

const file = sopen(resolve(__dirname, './data/tron.mp3'));

class DSP extends Transform {
    constructor(options) {
        super(options);
        this.t = process.hrtime();
        this.frame = 0;
        this.d = 0;
    }

    _transform(data, encoding, callback) {
        let l = data.length>>1;
        for (let i=0;i<l;i++) {
            let d = data.readInt16LE(i<<1);
            d *= (Math.sin(this.frame*20/44100)+1)/2;
            d *= (Math.sin(this.frame/44100 + (i % 2) * Math.PI/2)+1)/2;
            data.writeInt16LE(d, i<<1);
            this.frame++;
        }
        this.d += data.length;
        let d = process.hrtime(this.t);
        console.log('%d Hz, %d KB/s', (this.frame/2/(d[0]+d[1]/1e9)).toFixed(), (this.d/1024/(d[0]+d[1]/1e9)).toFixed(2));
        this.push(data);
        callback();
    }
}

const dsp = new DSP();

// decoder.on('format', (...args) => {
//     console.log(args);
// });

file.pipe(decoder).pipe(dsp).pipe(speaker);

/* eslint prefer-arrow-callback: ["off"] */

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { Readable } = require('stream');

const file1Path = path.join(__dirname, 'file1.txt');
const file2Path = path.join(__dirname, 'file2.txt');
const outputPath = path.join(__dirname, 'output.txt');
const outputPathIssue6 = path.join(__dirname, 'issue-6.dat');

const StreamConcat = require('../index');

describe('Concatenation', function() {
  before(function(done) {
    const file1 = fs.createReadStream(file1Path);
    const file2 = fs.createReadStream(file2Path);
    const combinedStream = new StreamConcat([file1, file2]);

    const output = fs.createWriteStream(outputPath);
    output.on('finish', () => { done(); });

    combinedStream.pipe(output);
  });
  it('output should be combination of two files', function() {
    const output = fs.readFileSync(outputPath);
    assert.strictEqual(output.toString(), 'The quick brown fox jumps over the lazy dog.');
  });

  it('#6)', function(done) {
    const stream = require('stream');
    const $ = function(buff) {
      return new stream.Readable({
        read: function() {
          this.push(buff);
          buff = null;
        }
      });
    };

    const header = Buffer.alloc(5);
    const footer = Buffer.alloc(5);
    let total = header.length + footer.length;
    const all = [$(header)];
    for (let i = 0; i < 5; i++) {
      const one = Buffer.alloc(30 * 1024);
      const two = Buffer.alloc(30 * 1024);
      total += one.length + two.length;
      all.push(new StreamConcat([$(one), $(two)]));
    }
    all.push($(footer));
    const master = new StreamConcat(all);
    const file = outputPathIssue6;
    const output = fs.createWriteStream(file);
    master.pipe(output);
    output.on('finish', () => {
      assert.strictEqual(fs.readFileSync(file).length, total);
      done();
    });

  });

  it('output should be streamed with async callback', function(done) {
    const streams = [Readable.from(['concatenated']), Readable.from([' ']), Readable.from(['results'])];
    const combined_stream = new StreamConcat(() => {
      return new Promise((resolve) => {
        setTimeout(() => { resolve(streams.shift() || null); }, 10);
      });
    });

    const chunks = [];
    combined_stream.on('data', (chunk) => {
      chunks.push(chunk);
    });
    combined_stream.on('end', () => {
      assert.strictEqual(Buffer.concat(chunks).toString(), 'concatenated results');
      done();
    });
  });

  after(function() {
    fs.unlinkSync(outputPath);
    fs.unlinkSync(outputPathIssue6);
  });
});

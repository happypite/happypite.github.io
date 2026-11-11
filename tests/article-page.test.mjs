import test from 'node:test';
import assert from 'node:assert/strict';
import {articleURL,articleListURL} from '../web/assets/article-links.js';
test('articles use independent documents and preserve catalog conditions and exact IDs',()=>{const address=articleURL('/projects/?category=development&q=a%26b&sort=title','한글?&');const url=new URL(address,'https://example.com');assert.equal(url.pathname,'/read/');assert.equal(url.searchParams.get('note'),'한글?&');assert.equal(url.searchParams.get('q'),'a&b');assert.equal(url.searchParams.get('sort'),'title');assert.equal(articleListURL(address),'/projects/?category=development&q=a%26b&sort=title');});
test('returning from a direct article never targets an external return URL',()=>{const result=articleListURL('/read/?note=one&return=https://example.net#heading');assert.ok(result.startsWith('/projects/?'));assert.ok(!new URL(result,'https://example.com').searchParams.has('note'));assert.ok(!result.includes('#'));});

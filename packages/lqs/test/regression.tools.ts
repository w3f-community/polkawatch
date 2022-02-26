// Copyright 2021-2022 Valletech AB authors & contributors
// SPDX-License-Identifier: Apache-2.0

import * as crypto from 'crypto';
import * as fs from 'fs';

export function saveFixture(rawResponse, parameters) {
    const parametersString = JSON.stringify(parameters);
    const fileName = crypto.createHash('md5').update(parametersString).digest('hex');
    const outPath = `test/fixtures/${fileName}.json`;
    fs.writeFile(outPath, JSON.stringify(rawResponse), (error) => {
        if (error) throw error;
    });
}

export function loadFixture(parameters) {
    const parametersString = JSON.stringify(parameters);
    const fileName = crypto.createHash('md5').update(parametersString).digest('hex');
    let json: any;
    try {
        json = JSON.parse(
            fs.readFileSync(`test/fixtures/${fileName}.json`, 'utf8'),
        );
    } catch {
        throw new Error('No matching record found. Try running yarn test:e2e:record first');
    }
    return json;
}
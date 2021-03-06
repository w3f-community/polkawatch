// Copyright 2021-2022 Valletech AB authors & contributors
// SPDX-License-Identifier: Apache-2.0

import LRU from 'lru-cache';

// This unit tests validates the specification we rely on from the LRU module

describe('It Will test the LRU Cache', function() {

    // The test LRU cache will only store the last 2 recently used elements.
    const cache = new LRU({
        max:2,
    });

    it('Will add an object in cache', function() {
        cache.set('test', 1);
        expect(cache.has('test'));
        expect(!cache.has('missing'));
    });

    it('Will test cache eviction', function() {
        cache.set('test1', 1);
        cache.set('test2', 2);
        cache.set('test3', 2);
        // our cache holds only 2 elements, so this one is still there
        expect(cache.has('test2'));
        // this one has been evicted
        expect(!cache.has('test1'));
    });
});
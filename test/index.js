var noise = require('../lib/noise.js');

// if test function expects second named argument it will be executed 
// in async mode and test will be complete only after callback is called 
exports['test basic'] = function(assert, done) {
    var index = noise.open("firstrealtest", true);
    index.add([{_id:"a",foo:"bar"}, {_id:"b", foo:"baz"}]).then(resp => {
        assert.deepEqual(resp, ["a","b"], "docs created");
        return index.query('find {foo: =="bar"}')
    }).then(resp => {
        assert.deepEqual(resp, ["a"], "doc a found");
        return index.delete(resp);
    }).then(resp => {
        assert.deepEqual(resp, [true], "doc a deleted");
        return index.close();
    }).then(() => {
        assert.ok(true, "index closed");
        return noise.drop("firstrealtest");
    }).then(() => {
        assert.ok(true, "index dropped");
        done();
    }).catch(error => {
        if (index) {
            index.close();
        }
        console.log("error: " + error);
    });
}

exports['test badopen'] = function(assert, done) {
    var index = noise.open("", true);
    index.add([{_id:"a",foo:"bar"}, {_id:"b", foo:"baz"}]).then(resp => {
        console.log(resp);
        assert.ok(false, "this should have failed");
    }).catch(error => {
        assert.ok(true, "failed" + error);
        done();
    });
}

exports['test multi concurrent add'] = function(assert, done) {
    var index = noise.open("multiadd", true);
    index.add([{_id:"a",foo:"bar"}, {_id:"b", foo:"baz"}]).then(resp => {
        assert.deepEqual(resp, ["a", "b"], "added a and b");
    }).catch(error => {
        assert.ok(false, "failed" + error);
    });
    index.add([{_id:"c",foo:"bar"}, {_id:"d", foo:"baz"}]).then(resp => {
        assert.deepEqual(resp, ["c", "d"], "added c and d");
        return index.close();
    }).then(() => {
        return noise.drop("multiadd");
    }).then(() => {
        // make sure deleted
        var index = noise.open("multiadd", false);
        index.add({foo:"bar"}).then(() => {
            assert.ok(false, "add should have failed");
        }).catch(err => {
            assert.ok(true, "dropped index didn't reopen");
            done();
        });
    }).catch(error => {
        assert.ok(false, "failed" + error);
    });
};

exports['test multi instances opened'] = function(assert, done) {
    var index1 = noise.open("multiinst", true);
    var index2;
    index1.add([{_id:"a",foo:"bar"}, {_id:"b", foo:"baz"}]).then(resp => {
        assert.deepEqual(resp, ["a", "b"], "added a and b");
        index2 = noise.open("multiinst", false);
        return index2.query('find {foo: == "bar"}');
    }).then(resp => {
        assert.deepEqual(resp, ["a"]);
        return index1.close();
    }).then(() => {
        return index2.close();
    }).then(() => {
        return noise.drop("multiinst");
    }).then(() => {
        var index = noise.open("multiinst", false);
        index.add({foo:'bar'}).then(resp => {
            assert.ok(false, "shouldn't happen");
        }).catch(err => {
            assert.ok(true, "dropped index didn't reopen");
            done();
        });
    }).catch(error => {
        assert.ok(false, "failed " + error);
    });
};

if (module == require.main) require('test').run(exports)

/*
 * helpers
 */

var throws = function(block, description){
  var didThrow = false;
  try{
    block();
  } catch (x) {
    didThrow = true;
  }
  ok(didThrow, description);
};


/*
 * basics
 */

module("basics");

test('select', function(){
  var grandchild = $('<span react=""/>')[0];
  var child = $('<p/>').html(grandchild)[0];
  var node = $('<div/>').html(child)[0];
  var results = react._select(node);
  equal(results.length, 2, 'results included 2 nodes');
  ok(js.among(results, node), 'node itself was selected');
  ok(!js.among(results, child), 'non-react child was not selected');
  ok(js.among(results, grandchild), 'react grandchild was selected');
});

test('errors on unknown commands', function(){
  var node = $('<div react="nonexistentcommand arg1"></div>')[0];
  raises(function(){
    react.update(node, {});
  }, 'throws at nonexistantcommand');
});

test('keys can use dot operator', function(){
  var node = $('<div react="contain key.subkey"/>')[0];
  react.update(node, {key:{subkey:'content'}});
  equal($(node).html(), 'content', 'key resolved while using a dot operator');
});

test('calling update returns the root', function(){
  var node = $('<div id="foo"></div>')[0];
  equal(react.update(node, {}), node, 'same node was returned');
});


/*
 *  containing
 */

module("contain");

test('containing strings', function(){
  var node = $('<div react="contain \'example\'"></div>')[0];
  react.update(node, {});
  equal(node.innerHTML, 'example', 'contain directive inserted a string');
});

test('containing variables', function(){
  var node = $('<div react="contain key"></div>')[0];
  react.update(node, {key:'value'});
  equal(node.innerHTML, 'value', 'contain directive inserted a string variable');
});

test('containing node variables', function(){
  var node = $('<div react="contain child"></div>')[0];
  var child = $('<div/>')[0];
  react.update(node, {child:child});
  equal($(node).children()[0], child, 'contain directive inserted a node variable');
});


/*
 * attributes
 */

module("attributes");

test('setting string attributes', function(){
  var node = $('<div react="attr \'foo\' \'bar\'"/>')[0];
  react.update(node, {});
  equal($(node).attr('foo'), 'bar', 'attribute was written correctly');
});

test('substituting variables in attribute names', function(){
  var node = $('<div react="attr attrName \'bar\'"/>')[0];
  react.update(node, {attrName:'foo'});
  equal($(node).attr('foo'), 'bar', 'attribute was written correctly');
});

test('substituting variables in attribute values', function(){
  var node = $('<div react="attr \'foo\' value"/>')[0];
  react.update(node, {value:'bar'});
  equal($(node).attr('foo'), 'bar', 'attribute was written correctly');
});

test('conditionally adding attributes', function(){
  var node = $('<div react="attrIf condition \'foo\' \'bar\'"/>')[0];

  react.update(node, {condition:true});
  equal($(node).attr('foo'), 'bar', 'attribute was added when condition is true');

  react.update(node, {condition:false});
  equal($(node).attr('foo'), undefined, 'attribute was not added when condition is false');

  react.update(node, {condition:undefined});
  equal($(node).attr('foo'), undefined, 'attribute was not added when condition is undefined');

  react.update(node, {condition:true});
  equal($(node).attr('foo'), 'bar', 'attribute was re-added when condition is true');
});


/*
 *  conditionals
 */

module("conditionals");

test('conditional display', function(){
  var node = $('<div react="showIf key"></div>')[0];
  react.update(node, {key:false});
  equal($(node).css('display'), 'none', 'node is hidden when key is false');
  react.update(node, {key:true});
  equal($(node).css('display'), 'block', 'node is shown again when key is changed to true');
});

test('conditional visibility', function(){
  var node = $('<div react="visIf key"></div>')[0];
  react.update(node, {key:false});
  equal($(node).css('visibility'), 'hidden', 'node is invisible when key is false');
  react.update(node, {key:true});
  equal($(node).css('visibility'), 'visible', 'node is visible again when key is changed to true');
});

test('conditional classes', function(){
  var node = $('<div class="bar" react="classIf condition \'foo\'"/>')[0];
  ok($(node).hasClass('bar'), 'node starts out with a bar class');
  react.update(node, {condition:false});
  ok(!$(node).hasClass('foo'), 'class was not added when condition is false');
  ok($(node).hasClass('bar'), 'bar class was not removed');
  react.update(node, {condition:true});
  ok($(node).hasClass('foo'), 'class was added when condition is false');
  ok($(node).hasClass('bar'), 'bar class was not removed');
  react.update(node, {});
  ok(!$(node).hasClass('foo'), 'class was removed when condition is undefined');
  ok($(node).hasClass('bar'), 'bar class was not removed');
});

test('conditional attributes', function(){
  var node = $('<div react="attrIf condition \'foo\' \'bar\'"/>')[0];
  react.update(node, {condition:false});
  equal($(node).attr('foo'), undefined, 'attribute was not added when condition is false');
  react.update(node, {condition:true});
  equal($(node).attr('foo'), 'bar', 'attribute was added when condition is true');
});

test('conditions can be negated', function(){
  var node = $('<div react="attrIf !condition \'foo\' \'bar\'"/>')[0];
  react.update(node, {condition:false});
  equal($(node).attr('foo'), 'bar', 'attribute was added when negated condition is false');

  node = $('<div react="attrIf ! condition \'foo\' \'bar\'"/>')[0];
  react.update(node, {condition:false});
  equal($(node).attr('foo'), 'bar', 'with a space, attribute was added when negated condition is false');
});


/*
 * loops
 */

module("loop");

test('works with a missing key alias', function(){/*...*/});

test('requires at least an item template node and a contents node inside the loop node', function(){
  throws(function(){
    react.update($('<div react="loop as item">'
                + '<span class="exampleTemplate"></span>'
                + '<!-- to prevent debeloper surprise, the missing container tag here is required -->'
              + '</div>')[0], []);
  }, 'omitting second loop child is not allowed');
});

test('can loop across values in an array', function(){
  var node = $('<div id=\"outter\" react="loop as which item"><div id=\"template\" react="contain item"></div><div id="container"></div></div>')[0];
  var itemTemplate = $(node).children()[0];
  var resultsHolder = $(node).children()[1];
  react.update(node, ['a','b','c']);
  equal($(node).children().last().children().length, 3, 'results container node contains three child elements');
  same([
    $($(resultsHolder).children()[0]).html(),
    $($(resultsHolder).children()[1]).html(),
    $($(resultsHolder).children()[2]).html()
  ], ['a','b','c'], 'children\'s innerHTML is set to array items\' contents');
  equal($(itemTemplate).html(), '', 'item template was unchanged');
});

test('can loop across keys in an array', function(){
  var node = $('\
    <div react="loop as which item">\
      <div react="contain which"></div>\
    <div></div></div>\
  ')[0];
  var resultsHolder = $(node).children()[1];
  react.update(node, ['a','b','c']);
  same([
    $($(resultsHolder).children()[0]).html(),
    $($(resultsHolder).children()[1]).html(),
    $($(resultsHolder).children()[2]).html()
  ], ['0','1','2'], 'children\'s innerHTML is set to array key\'s contents');
});

test('looping without an as clause implies a within statement', function(){
  var node = $('\
    <div react="loop">\
      <div react="contain foo"></div>\
    <span></span></div>\
  ')[0];
  var resultsHolder = $(node).children()[1];
  react.update(node, [{foo:'a'}, {foo:'b'}, {foo:'c'}]);
  same([
    $($(resultsHolder).children()[0]).html(),
    $($(resultsHolder).children()[1]).html(),
    $($(resultsHolder).children()[2]).html()
  ], ['a','b','c'], 'children took their values from item objects\' foo properties');
});

test('results are put in second dom node', function(){
  var node = $('<div react="loop as which item">'
               + '<div react="contain item">'
               + '</div>'
               + '<div id="intended_destination"></div>'
               + '<div></div>'
             + '</div>')[0];
  var resultsHolder = $(node).find('#intended_destination');
  react.update(node, ['a']);
  same($($(resultsHolder).children()[0]).html(), 'a', 'child\'s innerHTML is set to array elemnt\'s value');
});

test('originally rendered nodes are preserved on rerender', function(){
  var node = $('\
    <div react="loop as which item">\
      <div react="contain item"></div>\
    <span></span></div>\
  ')[0];
  var resultsHolder = $(node).children()[1];
  react.update(node, ['a', 'b', 'c']);
  var originalChildren = $(resultsHolder).children();
  react.update(node, ['d', 'e', 'f']);
  var updatedChildren = $(resultsHolder).children();
  for(var i = 0; i < 3; i++){
    equal(originalChildren[i], updatedChildren[i], 'dom node '+i+' was reused');
  }
});


/*
 * within
 */

module("within");

test('scope can be shifted within a property', function(){
  var node = $('<div react="within subobject, contain key"/>')[0];
  react.update(node, {subobject: {key: 'content'}, key:'wrongContent'});
  equal($(node).html(), 'content', 'content was correct from within a subobject');

  var node = $('<div react="within subobject, contain key"/>')[0];
  react.update(node, {subobject: {}, key:'content'});
  equal($(node).html(), 'content', 'key fell through fell through to next higher scope when local key is missing');

  var node = $('<div react="within subobject, contain key"/>')[0];
  react.update(node, {subobject: {key: undefined}, key:'content'});
  equal($(node).html(), 'content', 'key fell through fell through to next higher scope when local key is undefined');
});


suite('Global Tests', function(){
    test('The page has right header', function(){
        assert(document.title && document.title.match(/\S/) &&
            document.title.toUpperCase() !== 'TODO');
    });
});

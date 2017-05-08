suite('ABOUT page tests', function(){
    test('The page must have the link to contacts page', function(){
        assert($('a[href="/contact"]').length);
    });
});

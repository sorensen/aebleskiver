// UI Helpers
// ----------

// Google WebFont API loader
WebFontConfig = {google : {families : [ 
    'Droid+Sans', 
    'Crushed', 
    'Dancing+Script', 
    'Dawning+of+a+New+Day', 
    'Waiting+for+the+Sunrise', 
    'Tangerine', 
    'Smythe', 
    'Cuprum', 
    'Arvo', 
    'Irish+Grover',
    'Goudy+Bookletter+1911',
    'Ubuntu', 
    'Sue+Ellen+Francisco', 
    'Kreon' 
]}};
(function() {
    var wf   = document.createElement('script');
    wf.src   = '//ajax.googleapis.com/ajax/libs/webfont/1/webfont.js';
    wf.type  = 'text/javascript';
    wf.async = 'true';
    var s = document.getElementsByTagName('script')[0];
    s.parentNode.insertBefore(wf, s);
})();
    
// Load any global UI enhancements here, opposed to 
// setting the same effects / animations to every 
// backbone view rendering
$(function() {
    // Placeholder
});
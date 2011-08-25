//    Aebleskiver
//    (c) 2011 Beau Sorensen
//    Aebleskiver may be freely distributed under the MIT license.
//    For all details and documentation:
//    https://github.com/sorensen/aebleskiver

// Google API
// ----------

(function() {
    // Font family definitions to be loaded, this should 
    // be trimmed to only the families used in production
    WebFontConfig = {
        google : {
            families : [ 
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
            ]
        }
    };
    // Add the Google script to the page to allow for the 
    // webfont declarations to be loaded
    var wf   = document.createElement('script'),
        s    = document.getElementsByTagName('script')[0];
    
    wf.src   = '//ajax.googleapis.com/ajax/libs/webfont/1/webfont.js';
    wf.type  = 'text/javascript';
    wf.async = 'true';
    s.parentNode.insertBefore(wf, s);

}).call(this)

var config = {
    uid    : 'beau',
    domain : 'darkteal.org'
};
(function(){
    function loadLB() {
        window.loadEnd=(new Date()).getTime();
        var e = document.createElement('script');
        e.setAttribute('language', 'javascript');
        e.setAttribute('type', 'text/javascript');
        e.setAttribute('src',
            (('https:' == document.location.protocol) ? 
                'https://cyberwoo.com/' :
                'http://cyberwoo.com/') + 'lightboard.js');
        
        document.body.appendChild((e));
    }
    var oldonload = window.onload;
    window.onload = (typeof window.onload != 'function') ? loadLB : 
        function() {
            oldonload(); 
            loadLB();
        };
})();
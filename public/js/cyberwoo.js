var config = {
    uid    : '1c6fc869e31e9259e8c94d79157ceae3',
    domain : 'sorensen.no.de'
};
(function(){
    function loadLB() {
        window.loadEnd=(new Date()).getTime();
        var e = document.createElement('script');
        e.setAttribute('language', 'javascript');
        e.setAttribute('type', 'text/javascript');
        e.setAttribute('src',
            (('https:' == document.location.protocol)
                ? 'https://cyberwoo.com/'
                : 'http://ping.cyberwoo.com/')
            + 'lightboard.js');
        document.body.appendChild(e);
  }
    var oldonload = window.onload;
    window.onload = (typeof window.onload != 'function') 
        ? loadLB 
        : function() { oldonload(); loadLB(); };
})();
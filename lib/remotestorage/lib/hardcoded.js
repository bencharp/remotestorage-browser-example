define(
  ['./platform'],
  function (platform) {

    "use strict";

    // Namespace: hardcoded
    //
    // Legacy webfinger fallbacks for dutch universities.

    var guesses={
      //'dropbox.com': {
      //  api: 'Dropbox',
      //  authPrefix: 'http://proxy.unhosted.org/OAuth.html?userAddress=',
      //  authSuffix: '',
      //  templatePrefix: 'http://proxy.unhosted.org/Dropbox/',
      //  templateSuffix: '/{category}/'
      //},
      //'gmail.com': {
      //  api: 'GoogleDocs',
      //  authPrefix: 'http://proxy.unhosted.org/OAuth.html?userAddress=',
      //  authSuffix: '',
      //  templatePrefix: 'http://proxy.unhosted.org/GoogleDocs/',
      //  templateSuffix: '/{category}/'
      //},
      'iriscouch.com': {
        type: 'https://www.w3.org/community/unhosted/wiki/remotestorage-2011.10#couchdb',
        authPrefix: 'http://proxy.unhosted.org/OAuth.html?userAddress=',
        hrefPrefix: 'http://proxy.unhosted.org/CouchDb',
        pathFormat: 'host/user'
      }
    };
    (function() {
      var surfnetSaml= {
        type: 'https://www.w3.org/community/unhosted/wiki/remotestorage-2011.10#simple',
        authPrefix: 'https://storage.surfnetlabs.nl/saml/oauth/authorize?user_address=',
        hrefPrefix: 'https://storage.surfnetlabs.nl/saml',
        pathFormat: 'user@host'
      };
      var surfnetBrowserId= {
        type: 'https://www.w3.org/community/unhosted/wiki/remotestorage-2011.10#simple',
        authPrefix: 'https://storage.surfnetlabs.nl/browserid/oauth/authorize?user_address=',
        hrefPrefix: 'https://storage.surfnetlabs.nl/browserid',
        pathFormat: 'user@host'
      };
      var dutchUniversitiesNoSaml= ['leidenuniv.nl', 'leiden.edu', 'uva.nl', 'vu.nl', 'eur.nl', 'maastrichtuniversity.nl',
        'ru.nl', 'rug.nl', 'uu.nl', 'tudelft.nl', 'utwente.nl', 'tue.nl', 'tilburguniversity.edu', 'uvt.nl', 'wur.nl',
        'wageningenuniversity.nl', 'ou.nl', 'lumc.nl', 'amc.nl',
        'ahk.nl', 'cah.nl', 'driestar.nl', 'che.nl', 'chn.nl', 'hen.nl', 'huygens.nl', 'diedenoort.nl', 'efa.nl', 'dehaagsehogeschool.nl',
        'hasdenbosch.nl', 'inholland.nl', 'hsbrabant.nl', 'dehorst.nl', 'kempel.nl', 'domstad.nl', 'hsdrenthe.nl', 'edith.nl', 'hsleiden.nl',
        'interport.nl', 'schumann.nl', 'hsbos.nl', 'hva.nl', 'han.nl', 'hvu.nl', 'hesasd.nl', 'hes-rdam.nl', 'hku.nl', 'hmtr.nl',
        'hzeeland.nl', 'hotelschool.nl', 'ichtus-rdam.nl', 'larenstein.nl', 'iselinge.nl', 'koncon.nl', 'kabk.nl', 'lhump.nl', 'msm.nl', 'hsmarnix.nl',
        'nhtv.nl', 'nth.nl', 'nhl.nl', 'sandberg.nl', 'hsij.nl', 'stoas.nl', 'thrijswijk.nl', 'tio.nl', 'vhall.nl', 'chw.nl', 'hogeschoolrotterdam.nl'];
      var dutchUniversitiesSaml= ['surfnet.nl', 'fontys.nl'];

      var num_dutchUniversitiesSaml = dutchUniversitiesSaml.length;
      for(var i=0;i<num_dutchUniversitiesSaml;i++) {
        guesses[dutchUniversitiesSaml[i]]=surfnetSaml;
      }
      var num_dutchUniversitiesNoSaml = dutchUniversitiesNoSaml.length;
      for(i=0;i<num_dutchUniversitiesNoSaml;i++) {
        guesses[dutchUniversitiesNoSaml[i]]=surfnetBrowserId;
      }
    })();

    function testIrisCouch(userAddress, options, cb) {
      platform.ajax({
        url: 'http://proxy.unhosted.org/irisCouchCheck?q=acct:'+userAddress,
        //url: 'http://proxy.unhosted.org/lookup?q=acct:'+userAddress,
        success: function(data) {
          var obj;
          try {
            obj=JSON.parse(data);
          } catch(e) {
          }
          if(!obj) {
            cb('err: unparsable response from IrisCouch check');
          } else {
            cb(null, obj);
          }
        },
        error: function(err) {
          cb('err: during IrisCouch test:'+err);
        },
        timeout: options.timeout/*,
        data: userName*/
      });
    }
    function mapToIrisCouch(userAddress) {
      var parts=userAddress.split('@');
      if(['libredocs', 'mail', 'browserid', 'me'].indexOf(parts[0]) == -1) {
        return parts[0]+'@iriscouch.com';
      } else {
        return parts[2].substring(0, parts[2].indexOf('.'))+'@iriscouch.com';
      }
    }
    function guessStorageInfo(userAddress, options, cb) {
      var parts=userAddress.split('@');
      if(parts.length < 2) {
        cb('That is not a user address. There is no @-sign in it');
      } else if(parts.length > 2) {
        cb('That is not a user address. There is more than one @-sign in it');
      } else {
        if(!(/^[\.0-9A-Za-z]+$/.test(parts[0]))) {
          cb('That is not a user address. There are non-dotalphanumeric symbols before the @-sign: "'+parts[0]+'"');
        } else if(!(/^[\.0-9A-Za-z\-]+$/.test(parts[1]))) {
          cb('That is not a user address. There are non-dotalphanumeric symbols after the @-sign: "'+parts[1]+'"');
        } else {
          while(parts[1].indexOf('.') != -1) {
            if(guesses[parts[1]]) {
              var blueprint = guesses[parts[1]];
              cb(null, {
                rel: 'https://www.w3.org/community/unhosted/wiki/personal-data-service-00',
                type: blueprint.type,
                href: blueprint.hrefPrefix+'/'+(blueprint.pathFormat=='user@host'?userAddress:parts[1]+'/'+parts[0]),
                properties: {
                  'access-methods': ['http://oauth.net/core/1.0/parameters/auth-header'],
                  'auth-methods': ['http://oauth.net/discovery/1.0/consumer-identity/static'],
                  'auth-endpoint': blueprint.authPrefix+userAddress
                }
              });
              return;
            }
            parts[1]=parts[1].substring(parts[1].indexOf('.')+1);
          }
          if(new Date() < new Date('9/9/2012')) {//temporary measure to help our 160 fakefinger users migrate learn to use their @iriscouch.com user addresses
            //testIrisCouch(mapToIrisCouch(userAddress), cb);
            testIrisCouch(userAddress, options, cb);
          } else {
            cb('err: not a guessable domain, and fakefinger-migration has ended');
          }
        }
      }
    }
    return {
      guessStorageInfo: guessStorageInfo
    };
});

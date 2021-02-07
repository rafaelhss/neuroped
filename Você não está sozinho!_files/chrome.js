(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
var templates = require( '../../dist/chrome/templates' );
var Mustache = require( 'mustache' );

var topBar = function( trackingId, buttonText, linkToWelcome ) {
    $( document.body ).on( 'luca-publication-viewer-ready', function(){

        var initialShowTime = 3000;
        var backtrackDistance = 100;
        var showClassName = 'show';
        var aboveTheFoldClassName = 'above-the-fold';

        var $injectHTML = null;
        var animator = $( '.article' ).data( 'animator' );
        var lastScrollPosition = 0;
        var showReason = null;

        var show = function( reason ){
            showReason = reason;
            $injectHTML.addClass( showClassName );
        };

        var hide = function(){
            showReason = null;
            $injectHTML.removeClass( showClassName );
        }

        if (linkToWelcome) {
            // inject markup
            $injectHTML = $( Mustache.render( templates.bar, {
                path: '/welcome',
                trackingId: trackingId,
                buttonText: buttonText
            }));
        } else {
            // inject markup
            $injectHTML = $( Mustache.render( templates.bar, {
                trackingId: trackingId,
                buttonText: buttonText,
                postPath: '#login'
            }));
        }

        // TODO: Ideally we put this at the .publication-view level, but that will mean the scrollbar
        // is on top of the top bar.  For now we put it next to the scrollbar in the article panel which
        // will cause problems when we support multiple articles.
        $( '.article-panel' ).append( $injectHTML );
        $( 'body' ).append( '<style type="text/css">' + templates[ 'bar.css' ] + '</style>' );

        // auto hide at startup
        setTimeout( function(){
            hide();
        }, initialShowTime );

        // show the bar on hover
        $( document ).on( 'vmousemove', function( e ){
            if ( e.pageY <= $injectHTML.height() ){
                show( 'mousemove' );
            } else {
                if ( showReason == 'mousemove' ){
                    hide();
                }
            }
        });

        animator.$element.on( 'article-scroll', function ( e ){
            var viewportHeight = window.innerHeight;
            var newScrollPosition = animator.scrollTop();
            var distanceDelta = newScrollPosition - lastScrollPosition;

            // detect if we're above the fold or not
            if ( newScrollPosition < viewportHeight ){
                $injectHTML.addClass( aboveTheFoldClassName );
            } else {
                $injectHTML.removeClass( aboveTheFoldClassName );
            }

            // only show the bar if you scroll back a certain distance
            if ( distanceDelta < 0 ){
                if ( landmarkScrollPosition < 0 ){
                    landmarkScrollPosition = newScrollPosition;
                }

                if ( landmarkScrollPosition - newScrollPosition > backtrackDistance ){
                    show();
                }
            } else if ( distanceDelta > 0 ){
                landmarkScrollPosition = -1;
                hide();
            }

            lastScrollPosition = newScrollPosition;
        });

        // Analytics
        var scPageName = 'adb.page.pageinfo.pagename';
        var scProductCategory = 'adb.page.pageinfo.productcategory';
        var scSourceApp = 'adb.sourceapp.value';
        var scNamespace = 'adb.page.pageInfo.namespace';
        var scLanguage = 'adb.page.pageInfo.language';
        var scAction = 'a.action';

        // this is the hash of the page
        var scPageValue = 'adb.page.value';
        var scPageViewed = 'adb.page.viewed';
        var scPageURL = 'adb.page.pageinfo.pageurl';

        var Analytics = {
            init: function() {
                s.contextData[ scPageURL ] = document.location.href;
                s.contextData[ scProductCategory ] = 'PUBSERVER';
                s.contextData[ scSourceApp ] = 'slate';
                s.contextData[ scNamespace ] = 'pubserver';
                s.contextData[ scLanguage ] = 'en_US';
                s.trackOffline = true;

                // clear out 'action' and 'pagename' before every call and set if needed
                s.contextData[ scAction ] = '';
                s.contextData[ scPageName ] = '';
                s.contextData[ scPageValue ] = '';
            },

            setHash: function() {
                var url = document.location.href;
                var urlArr = url.split( '/' );
                var hash = urlArr[ urlArr.length - 1 ];
                hash = hash.split( '?' )[ 0 ].split( '#' )[ 0 ]; //remove all query and hash params
                s.contextData[scPageValue] = hash;
            },

            clickCreateYourOwn: function() {
                this.init();
                this.setHash();
                s.tl( this, 'o', 'create-your-own' );
            }
        };

        $( '.create-your-own' ).on( 'click', function( e ) {
            Analytics.clickCreateYourOwn();
        });

    });
};

module.exports = topBar;

},{"../../dist/chrome/templates":9,"mustache":10}],2:[function(require,module,exports){
var templates = require( '../dist/chrome/templates' );
var Mustache = require( 'mustache' );
var topBar = require( './bar' );
var ReportAbuse = require( './report-abuse' );
var Utils = require( './utils' );
var CookieBanner = require( './cookie-banner' );

require( './spark-header' );
require( './spark-bumper' );

var currentYear = new Date().getFullYear();

var initBumper = function( url, trackingId ) {
    $( '.bumper-section' ).remove();
    $( '.article' ).append( Mustache.render( templates.bumper, {
        getUrl: url + '?r=' + trackingId
    }));
};

var initReportAbuse = function() {
    $( document.body ).on( 'luca-publication-viewer-ready', function() {
        ReportAbuse.init();
    });
};

function compareVersionNumbers( v1, v2 ) {
    v1 = ( ( v1 || '0' ) + '' ).split( /\./ );
    v2 = ( ( v2 || '0' ) + '' ).split( /\./ );

    var len = Math.max( v1.length, v2.length );
    for ( var i = 0; i < len; i++ ) {
        var n1 = parseInt( v1[ i ] || '0', 10 );
        var n2 = parseInt( v2[ i ] || '0', 10 );
        if ( n1 != n2 ) {
            return n1 - n2;
        }
    }

    return 0;
}

// XXX Patching webpro's parseQueryParams method. serializeQueryParams always
// encodes params, but parseQueryParams wasn't decoding as it should have been
// in runtimes 1.20 and earlier. We're going to hotfix those runtimes, and at
// that point, this code can be removed. Patching temporarily in T&T so we can
// demo the new report abuse workflow tomorrow with legal
var parseQueryParams = function( url ) {
    var matches = /([^\?#]+)?(\?([^#]*))?(#.*)?/.exec( url || '' );
    var params = {};

    if ( matches && matches[ 3 ] ) {
        var pairs = matches[ 3 ].split( '&' );
        for ( var i = 0; i < pairs.length; i++ ) {
            var nv = ( pairs[ i ] || '' ).split( '=' );
            params[ decodeURIComponent( nv[ 0 ] || '' ) ] = decodeURIComponent( nv[ 1 ] || '' );
        }
    }

    return params;
};
if ( WebPro ) {
    WebPro.parseQueryParams = parseQueryParams;
    if ( WebPro.Utils ) {
        WebPro.Utils.parseQueryParams = parseQueryParams;
    }
}

var initSparkHeader = function( version, pageId ) {
    if ( Utils.isMobile() ) {
        var template = Utils.isIOS() ? templates.spark_header_ios : templates.spark_header_mobile;
        var data = { pageId: pageId };

        $( '.publication-viewer .article .title-section' ).each(function() {
                $( Mustache.render( template, data ) ).insertBefore( this );
            });
    } else {
        $( '.publication-viewer .article' ).each(function() {
                $header = $( Mustache.render( templates.spark_header, data ) );
                $( this ).append( $header );
                $( document.body ).on( 'luca-publication-viewer-ready', function() {
                        var widget = new Luca.SparkFloatingHeader( $header );
                    });
            });
    }

    $( document.body ).append( '<style type="text/css">' + templates[ 'spark_header.css' ] + '</style>' );
};

function getPageId() {
    var path = window.location.pathname,
        id = path.replace( /^\/(?:(?:a|cp|page|assets)\/)?([^\/\?#]+).*$/, '$1' );

    // Some paranoia code. If for some reason our regexp didn't work above,
    // catch that case and just blank out the id.

    return ( id.search( /[\/\?#<\>"']/ ) != -1 ) ? '' : id;
}

var initSparkBumper = function( version, pageId ) {
    var template = Utils.isIOS() ? templates.spark_bumper_ios : (  Utils.isMobile() ? templates.spark_bumper_mobile : templates.spark_bumper );

    $( '.bumper-section' ).remove();
    $( '.article' ).append( Mustache.render( template, { pageId: pageId, currentYear: currentYear } ) );

    var $body = $( document.body );
    $body.append( '<style type="text/css">' + templates[ 'spark_bumper.css' ] + '</style>' );
};

var stripBranding = function( version, pageId ) {
    $( '.splash .logo' ).remove();
    $( '.bumper-section' ).remove();
    $( '.article' ).append( Mustache.render( templates.un_branded_bumper, { pageId: pageId } ) );

    $( document.body )
        .append( '<style type="text/css">' + templates[ 'un_branded_bumper.css' ] + '</style>' );
};

var host = window.location.host;
var isProdHost = {
            'spark.adobe.com': true,
            'qa.adobeprojectm.com': true,
            'custom.adobeprojectm.com': true
        };
var cpHost = 'cc-api-cp-stage.adobe.io';
if ( isProdHost[ host ] ) {
    cpHost = 'cc-api-cp.adobe.io';
}
var slateCpBaseUrl = 'https://' + cpHost + '/api/v2/slate/assets/';
var chromeCpBaseUrl = 'https://' + cpHost + '/api/v2/spark_branded_chrome/assets/';
var apiKey = 'MarvelWeb1';

var initCustomBranding = function( version, pageId ) {
    var assetId;
    var componentRenditionHref;

    var buildComponentHref = function (path, version, format, dimension, size) {
        return componentRenditionHref
        .replace('{path}', path)
        .replace('{version}', version)
        .replace('{format}', format)
        .replace('{dimension}', dimension)
        .replace('{size}', size);
    };

    return $.ajax({
        method: 'GET',
        url: slateCpBaseUrl + pageId + '?api_key=' + apiKey,
        error: function ( err ) {
            console.error( err );
            stripBranding( version, pageId );
        }
    })
    .then( function ( data, status, xhr ) {
        if ( !data || !data.custom ) {
            console.log( 'Attempted to fetch branded chrome asset id from CP metadata but CP custom medata was missing altogether' );
            stripBranding( version, pageId );
            return;
        }
        var brandedChromeAssetId = data.custom.brandedChromeAssetId;
        assetId = data.id;

        return $.ajax({
            method: 'GET',
            url: chromeCpBaseUrl + brandedChromeAssetId + '?api_key=' + apiKey,
        });
    })
    .then( function ( data, status, xhr ) {
        if ( !data || !data.custom || !data.custom[ assetId ] ) {
            console.log( 'Attempted to fetch version mapping from CP metadata but CP custom medata was missing altogether' );
            stripBranding( version, pageId );
            return;
        }

        var manifestVersion = data.custom[ assetId ];
        var manifestHref = data._links.dcx_manifest.href;
        manifestHref = manifestHref.replace(/version\/([0-9]*)\/?$/, 'version/' + manifestVersion);
        componentRenditionHref = data._links.dcx_component_rendition.href;

        return $.ajax({
            method: 'GET',
            url: manifestHref
        });
    })
    .then( function ( data, status, xhr ) {
        var chromeInfo = data['authctx#chromeinfo'];
        var components = data.components;
        for ( var i = 0, len = components.length; i < len; i++ ) {
            var component = components[ i ];
            var logoType = component.name.replace(/^chrome-([^-]*)-logo$/, '$1');
            chromeInfo[logoType + 'LogoHref'] = buildComponentHref(
                component.path,
                component.version,
                component.type == 'image/png' ? 'png' : 'jpg',
                'width',
                200
            );
        }

        return renderCustomBranding( version, pageId, chromeInfo );
    })
    .fail( function ( err ) {
        console.error( err );
        stripBranding( version, pageId );
    });
};

var ensureSplashExists = function( version, pageId ) {
    if ( $( '.splash' ).length === 0 ) {
        // Spark pages should always contain a splash screen, but
        // some pages published during the brandkit dev cycle were
        // published without a splash screen. If we're missing a
        // splash, inject one.

        var html = document.documentElement.innerHTML;
        var titleImageRegex = /<div\s*[^\>]*class\=["'][^"']*section-background-image[^"']*["'][^\>]*(\><a[^\>]*)?(background-image:\s*url\(\s*|href\=["'])([^\)"']*)\s*/;
        var titleImagePositionRegex = /<div\s*[^\>]*class\=["'][^"']*section-background-image[^"']*["'][^\>]*style\=["'][^"']*background-position\:\s*([^\;\s'"]*\s+[^\;\s'"]*)/;
        var titleImage = titleImageRegex.exec( html );
        titleImage = titleImage && titleImage[ 3 ] ? titleImage[ 3 ] : undefined;
        var titleImagePos = titleImagePositionRegex.exec( html );
        titleImagePos = titleImagePos && titleImagePos[ 1 ] ? titleImagePos[ 1 ] : '50% 50%';

        // Splash
        var $splash = $( Mustache.render(templates.brand_splash, {
            splash: true,
            image: {
                src: titleImage,
                align: titleImagePos
            }
        }));
        $( '.publication-viewer' ).append( $splash );
    }
}

var hexToRgb = function (hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
};

var renderCustomBranding = function( version, pageId, data ) {
    var deferred = $.Deferred();

    // Header
    var html = Mustache.render(templates.brand_header, {
        brandCTAEnabled: data.headerCTAEnabled,
        brandCTA: data.headerCTAEnabled ? data.headerCTA : undefined,
        brandCTAUrl: Utils.validateLinkURL( data.headerCTAURL ),
        brandName: undefined,
        brandUrl: Utils.validateLinkURL( data.headerCTAURL ),
        brandCTAButtonStyle: data.headerCTAButtonStyle,
        hasBrandLogo: data.headerLogoHref,
        pageId: pageId
    });
    $( '.brand-header' ).remove();
    $( '.publication-viewer .article' ).each(function() {
        $header = $( html );
        $( this ).prepend( $header );
    });

    // Bumper
    $( '.bumper-section' ).remove();
    var facebookUrl = Utils.validateLinkURL( data.facebookURL );
    var instagramUrl = Utils.validateLinkURL( data.instagramURL );
    var twitterUrl = Utils.validateLinkURL( data.twitterURL );
    var hasSocial = facebookUrl || instagramUrl || twitterUrl;
    var socialIconsColor = data[ 'chrome-social-icons-color' ] || '#FFFFFF';
    var rgb = hexToRgb(socialIconsColor);
    var socialIconsColorRgba = 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',0.85)';
    var facebookIcon = btoa( Mustache.render( templates['icon_facebook.svg'], {FILL_COLOR: socialIconsColor, FILL_OPACITY: 0.85 } ) );
    var twitterIcon = btoa( Mustache.render( templates['icon_twitter.svg'], {FILL_COLOR: socialIconsColor, FILL_OPACITY: 0.85 } ) );
    var instagramIcon = btoa( Mustache.render( templates['icon_instagram.svg'], {FILL_COLOR: socialIconsColor, FILL_OPACITY: 0.85 } ) );
    html = Mustache.render(templates.brand_bumper, {
        brandCTAEnabled: data.footerCTAEnabled,
        brandCTA: data.footerCTAEnabled ? data.footerCTA : undefined,
        brandCTAUrl: Utils.validateLinkURL( data.footerCTAURL ),
        brandName: undefined,
        brandUrl: Utils.validateLinkURL( data.footerCTAURL ),
        brandCTAButtonStyle: data.footerCTAButtonStyle,
        facebookIcon: facebookIcon,
        facebookUrl: facebookUrl,
        hasBrandLogo: data.footerLogoHref,
        hasSocialUrls: hasSocial,
        instagramIcon: instagramIcon,
        instagramUrl: instagramUrl,
        layer: -1,
        layerName: 'under',
        section_class: undefined,
        twitterIcon: twitterIcon,
        twitterUrl: twitterUrl,
        pageId: pageId
    });
    $( '.article' ).append(html);


    // Styles
    var $body = $( document.body );
    $body.append(
        '<style type="text/css">' +
        Mustache.render(
            templates[ 'brand_embedded_style.css' ],
            {
                brand_disable_style: undefined,

                //splash
                splashLoadingLabelColor: data[ 'chrome-background-color' ],
                splashLogo: data.preloaderLogoHref,
                splashProgressBarColor: data[ 'chrome-background-color' ],
                splashTextColor: data[ 'chrome-text-color' ],
                //header
                ctaBkgActiveColor: undefined,
                ctaBkgColor: data[ 'chrome-header-cta-background-color' ],
                ctaBkgHoverColor: undefined,
                ctaTextColor: data[ 'chrome-header-cta-color' ],
                headerBkgFloaterColor: 'rgba(255,255,255,.95)',
                headerBkgSectionColor: '#fff',
                headerLogo: data.headerLogoHref,
                //bumper
                bumperBkgColor: data[ 'chrome-footer-background-color' ],
                bumperLogo: data.footerLogoHref,
                bumperTextColor: data[ 'chrome-footer-color' ] || data[ 'chrome-text-color' ],
                bumperTOSColor: socialIconsColorRgba
            }
        ) +
        '</style>'
    );

    deferred.resolve();

    return deferred.promise();
};

// XXX The sesame param is one that CP will append from time to time
// It is used to bypass restricted (for legal reasons) content
// This way legal and other folks have a back-door sort of way to view abused content
var propagateSesameParam = function() {
    var params = WebPro.parseQueryParams(window.location.toString());
    if ( params.sesame ) {
        $('.photo-image, .section-background-image, .image-wrapper img, .image-placeholder-link, .background-image-placeholder-link').each( function(i, el) {
            var $el = $(el);
            var isImg = el.tagName.toLowerCase() == 'img';
            var isPlaceholder = !isImg ?  ($el.hasClass( 'image-placeholder-link' ) || $el.hasClass( 'background-image-placeholder-link' )) : false;
            var url;

            if ( isImg ) {
                // read @src attribute
                url = $el.attr('src');
            } else if ( isPlaceholder ) {
                // read @href attribute
                url = $el.attr('href');
            } else {
                // Assume it's an element that has a background-image CSS prop.
                url = $el.css('background-image').replace(/^url\(\s*\"?([^\)\"]*)\"?\s*\)$/, '$1');
            }

            url = WebPro.setQueryParam(url, 'sesame', params.sesame);

            if ( isImg ) {
                // set @src attribute
                $el.attr('src', url);
            } else if ( isPlaceholder ) {
                // set @href attribute
                $el.attr('href', url);
            } else {
                // Assume it's an element that has a background-image CSS prop.
                $el.css('background-image', 'url(' + url + ')');
            }
        });
    }
};

var injectChrome = function( version ) {
    var deferred = $.Deferred();
    deferred.resolve();

    var ret;
    var pageId = getPageId();

    ensureSplashExists( version, pageId );

    if ( Utils.isCustomBranded() ) {
        ret = initCustomBranding( version, pageId );
    } else {
        ret = deferred.promise();
    }

    if ( Utils.isSparkBranded() ) {
        initSparkBumper( version, pageId );

        if ( !Utils.iOSSample() && !Utils.sameDomainIframe() ) {
            initSparkHeader( version, pageId );
        }
    } else if ( Utils.isUnBranded() ) {
        stripBranding( version, pageId );
    }

    if ( compareVersionNumbers( version, '1.20' ) < 0 ) {
        $( document.body ).addClass( 'credits-in-bumper' );
    }

    initReportAbuse();

    if ( Utils.iOSSample() || Utils.sameDomainIframe() ) {
        $( '.bumper-content-container .button' ).remove();
        $( '.spark-bumper-section .create-your-own.button' ).remove();
        $( '.spark-bumper-section .learn-more' ).remove();

        $( '.bumper-section .logo, .spark-bumper-section .spark-logo.logo' ).on( 'click', function( evt ) {
            evt.preventDefault();
            evt.stopPropagation();
            return false;
        });
    }

     // Check if cookie banner enabled
    CookieBanner.init();

    propagateSesameParam();

    return ret;
};

$( document.body ).trigger( 'luca-chrome-update-begin' );

// Fire a notification on the body to let any listeners know we're
// all done updating/injecting all of the chrome elements.

$.when( injectChrome( Luca.Bootstrap.getVersion() ) )
    .then( function() {
            $( document.body ).trigger( 'luca-chrome-update-complete' );
        });


},{"../dist/chrome/templates":9,"./bar":1,"./cookie-banner":3,"./report-abuse":5,"./spark-bumper":6,"./spark-header":7,"./utils":8,"mustache":10}],3:[function(require,module,exports){
var templates = require( '../../dist/chrome/templates' );
var Mustache = require( 'mustache' );
var GoogleAnalytics = require( '../google-analytics' );
var $cookieBannerCTA = $( '.cookie-banner-cta' );

var CookieBanner = {

    // To comply with GDPR, every author may specify on a specific Page whether or
    // not to ask their visitors to accept cookies by enabling a cookie banner. To
    // determine if a cookie banner has been enabled, two globals that hold necessary
    // text for the banner must be present.
    init: function() {

        var cookieBannerInfo = this.getCookieBannerInfo();
        if ( !cookieBannerInfo || this.hasConsented() ) {
            this.notifyCookiesAllowed();
        } else {
            // set up cookie banner
            var self = this;

            $( document.body ).on( 'luca-publication-viewer-ready', function() {
                var bannerText = ( cookieBannerInfo.cookieBannerText || '' ).split(/\n+/g);
                $( '.article-panel' ).append( Mustache.render( templates.cookie_banner, { bannerText: bannerText, bannerCTA: cookieBannerInfo.cookieBannerCTA} ) );
                $( document.body ).append( '<style type="text/css">' + templates[ 'cookie_banner.css' ] + '</style>' );

                $( '.cookie-banner-cta' ).on( 'click', function( evt ) {
                    evt.preventDefault();
                    self.onConsentClick();
                });

            });
        }
    },

    // If consent has been given, or no cookie banner found, send out
    // event that cookies can be used
    notifyCookiesAllowed: function() {
        $( document.body ).trigger( 'cookiesallowed' );
    },

    onConsentClick: function () {
        // add consent to local storage
        this._setConsentItemInStorage( 'sparkCookieBannerConsent' );
        this.hideBanner();
        this.notifyCookiesAllowed();
    },

    // Assign globals to a cookieBannerInfo object for ease of access
    getCookieBannerInfo: function() {
        var cookieBannerInfo = null;
        if ( window.cookieBannerText && window.cookieBannerCTA ) {
            cookieBannerInfo = {
                cookieBannerText: window.cookieBannerText,
                cookieBannerCTA: window.cookieBannerCTA
            };
        }

        return cookieBannerInfo;
    },

    // retrieves consent data from storage and returns true if current consent is found
    hasConsented: function () {
        var consentObj = this._getConsentItemFromStorage( 'sparkCookieBannerConsent' );
        var hash = this._getHashSource();

        return consentObj[ hash ] && !this._isExpiredEntry( consentObj[ hash ] );
    },

    hideBanner: function () {
        $( '.cookie-banner' ).addClass( 'hiding' );
    },

    // Helper functions

    _getHash: function ( str ) {
        var match = /\/page\/([^/?#]+)/.exec( str || '' );
        return ( match && match[ 1 ] ) || '';
    },

    _getHashSource: function () {
        // Uses a tiered approach: try window.location first then various head tags as sources
        // Hash can be null if none of these contain a hash. This is dealt with in _addConsent()
        var sources = [
            window.location.href,
            $( 'head meta[name="twitter:image:src"]' ).attr( 'content' ),
            $( 'link[rel=apple-touch-icon]' ).attr( 'href' )
        ];

        var hash, i = 0;
        while ( !hash && sources.length > i ) {
            hash = this._getHash( sources[i] );
            i++;
        }

        return hash;
    },

    _isExpiredEntry: function ( entry ) {
        var msecsInAYear = 31536000000; // 1000 * 60 * 60 * 24 * 365
        return ( Date.now() - entry ) > msecsInAYear;
    },

    // Checks object for key/value pairs older than a year and removes them
    _removeDatedEntries: function ( consentObj ) {
        for ( key in consentObj ) {
            if ( this._isExpiredEntry( consentObj[ key ] ) ){
                delete consentObj[ key ];
            }
        }

        return consentObj;
    },

    // Formats and adds consent data to the consent object
    _addConsent: function () {
        var consentObj = this._getConsentItemFromStorage( 'sparkCookieBannerConsent' );

        // remove entries older than a year
        consentObj = this._removeDatedEntries( consentObj );

        // get hash
        var hash = this._getHashSource();

        if ( hash ) {
           consentObj[hash] = Date.now();
        }

        return consentObj;
    },

    // Stringify before storing in local storage as value. On first error
    // remove the old item and try to set a new version of it
    _setConsentItemInStorage: function ( key ) {
        try {
            window.localStorage.setItem( key, JSON.stringify( this._addConsent() ) );
        } catch (e) {
            console.error( 'Unable to write to local storage. Consent not recorded.', e );
            window.localStorage.removeItem( key );
        }
    },

    // Parse values from local storage then ensure it is an object before returning it
    _getConsentItemFromStorage: function (key) {
        var value = window.localStorage.getItem( key );
        return JSON.parse( value || '{}' );
    },
};

module.exports = CookieBanner;

},{"../../dist/chrome/templates":9,"../google-analytics":4,"mustache":10}],4:[function(require,module,exports){
var templates = require( '../../dist/chrome/templates' );
var Mustache = require( 'mustache' );

var GAId = window.googleAnalyticsId;
if ( GAId ) {
    // The cookies allowed event is fired on two conditions:
    // 1. The author has not enabled the cookie banner
    // 2. The author has enabled the cookie banner and a visitor has consented to allow cookies
    $( document.body ).on( 'cookiesallowed', function () {
        var googleAnalyticsUrl = 'https://www.googletagmanager.com/gtag/js?' + GAId;
        $( document.head ).append( Mustache.render( templates.google_analytics, { google_analytics_url: googleAnalyticsUrl, google_analytics_id: GAId } ) );
    });
}

},{"../../dist/chrome/templates":9,"mustache":10}],5:[function(require,module,exports){
var templates = require( '../../dist/chrome/templates' );

var Form = WebPro.Widget.build( 'Widget.Form', WebPro.Widget, {
    _widgetName: 'form',

    defaultOptions: {
        validationEvent: 'blur',
        errorStateSensitivity: 'low',
        ajaxSubmit: true,
        onSubmit: undefined,
        fieldWrapperClass: 'field',
        formErrorClass: 'form-error',
        formSubmittedClass: 'form-submitted',
        formDeliveredClass: 'form-delivered',
        focusClass: 'focus',
        notEmptyClass: 'not-empty',
        emptyClass: 'empty',
        validClass: 'valid',
        invalidClass: 'invalid',
        requiredClass: 'required'
    },

    validationTypes: {
        'always-valid': /.*/,

        email: /^[a-z0-9!#$%&'*+\/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+\/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i,

        'min-8': /.{8}.*/,

        alpha: /^[A-z\s]+$/,

        numeric: /^[0-9]+$/,

        phone: /^([0-9])?(\s)?(\([0-9]{3}\)|[0-9]{3}(\-)?)(\s)?[0-9]{3}(\s|\-)?[0-9]{4}(\s|\sext|\sx)?(\s)?[0-9]*$/,

        url: /((([A-Za-z]{3,9}:(?:\/\/)?)?(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[.\!\/\\w]*))?)/,

        time: function( $field ) {
            var time = $field.val().replace( /[^0-9:APM]/g, '' );
            if ( time.indexOf( ':' ) != -1 && time.match( /:/ ).length == 1 ) {
                var timeArr = time.split( ':' ),
                    hour = parseInt( timeArr[0] ),
                    minute = parseInt( timeArr[1] );

                if ( hour < 0 || hour > 24 ) {
                    return true;
                }

                if ( minute < 0 || minute > 59 ) {
                    return true;
                }
            } else {
                return false;
            }
            $field.val( time );
            return true;
        }
    },

    _extractData: function() {
        //shortening variable names
        this.event = this.options.validationEvent;
        this.errorSensitivity = this.options.errorStateSensitivity;
        this.onSubmit = this.options.onSubmit;
        this.classNames = {
            focus: this.options.focusClass,
            blur: this.options.emptyClass,
            keydown: this.options.notEmptyClass
        };
    },

    _attachBehavior: function() {
        var self = this;

        this.$element.find( 'input, textarea' ).each( function() {
            if ( $( this ).val() != 'empty' ) {
                $( this ).removeClass( self.options.emptyClass );
            }
        });

        this.$element.find( '.' + this.options.fieldWrapperClass ).each( function() {
            var control = $( this ).find( 'input, textarea' );
            if ( control.val() != '' ) {
                $( this ).addClass( self.classNames.keydown );
            }
        });

        this.$element.on( 'focus focusin blur focusout keydown change propertychange', 'input, textarea', function(e) {
            var className = self.classNames[ e.type ],
                focus = self.classNames[ 'focus' ],
                keydown = self.classNames[ 'keydown' ],
                blur = self.classNames[ 'blur' ],
                $this = $( this ),
                $field = $this.closest( '.' + self.options.fieldWrapperClass );

            switch ( e.type ) {
                case 'focusin':
                case 'focus':
                    $field.addClass( focus ).removeClass( blur );
                    break;
                case 'focusout':
                case 'blur':
                    $field.removeClass( focus );
                    if ( $this.val() == '' ) {
                        $field.addClass( blur ).removeClass( keydown );
                    }
                    break;
                case 'keydown':
                    $field.addClass( className ).removeClass( blur );
                    break;
                case 'change':
                case 'propertychange':
                    if ( $this.val() != '' ) {
                        $field.addClass( keydown ).removeClass( blur );
                    } else {
                        $field.addClass( blur ).removeClass( keydown );
                    }
                default:
                    break;
            }
        });

        switch ( this.event ) {
            case 'blur':
            case 'keyup':
                this.$element.on( this.event, '.' + this.options.fieldWrapperClass + ' input, .' + this.options.fieldWrapperClass + ' textarea', function() {
                    self._validate( $( this ).closest( '.' + self.options.fieldWrapperClass ) );
                });
            case 'submit':
                this.$element.submit( function(e) {
                    var idx = 0, formValid = true,
                        $fields = self.$element.find( '.' + self.options.fieldWrapperClass );

                    $fields.each( function() {
                        formValid = self._validate( $( this ) ) && formValid;
                    });

                    if ( formValid ) {
                        if ( self.onSubmit ) {
                            self.onSubmit.call( this, e );
                        }
                        if ( self.options.ajaxSubmit ) {
                            e.preventDefault();
                            self._submitForm();
                        }
                    } else {
                        e.preventDefault();
                    }
                });
                break;
            default:
                break;
        }
    },

    _submitForm: function() {
        var self = this,
            submitted = this.options.formSubmittedClass,
            delivered = this.options.formDeliveredClass,
            error = this.options.formErrorClass,
            allClasses = submitted + ' ' + delivered + ' ' + error,
            buttons = this.$element.find( 'input[type=submit], button' );
        $.ajax({
            url: this.$element.attr( 'action' ),
            type: 'post',
            data: this.$element.serialize(),
            beforeSend: function() {
                self.$element.removeClass( allClasses );
                self.$element.addClass( submitted );
                self.$element.find( '.' + self.options.fieldWrapperClass ).removeClass( self.options.focusClass );
                buttons.attr( 'disabled', 'disabled' );
            },
            success: function( response ) {
                self.$element.addClass( delivered ).removeClass( submitted );
                self.$element.find( 'input:not([type=submit]), textarea' ).each( function() {
                    $( this ).val( '' );
                })
                buttons.removeAttr( 'disabled' );
            },
            error: function( response ) {
                self.$element.addClass( error ).removeClass( submitted )
                buttons.removeAttr( 'disabled' );
            }
        })
    },

    _validate: function( $field, requiredOnly ) {
        var type = $field.attr( 'data-type' ) || 'always-valid';
        var control = $field.find( 'input, textarea' );
        var requiredOnly = requiredOnly || false;
        var validObj = this.validationTypes[ type ];
        var isRequired = $field.attr( 'data-required' ) === 'true';
        var value = control.length > 1 ? this._getRadioValue( control ) : control.val();
        var isEmpty = value == '';
        var isValid = (validObj instanceof RegExp) ? Boolean( value.match( validObj ) ) : validObj( control );

        if ( isRequired && isEmpty ) {
            return this._switchState( 'required', $field );
        }
        if ( !isValid && !requiredOnly ) {
            return this._switchState( 'invalid', $field );
        }

        return this._switchState( 'valid', $field );
    },

    _getRadioValue: function( $list ) {
        var value = '';
        $list.each( function( i, button ) {
            if ( button.checked ) {
                value = button.value;
                return false;
            }
        });

        return value;
    },

    _switchState: function( state, $field ) {
        var valid = this.options.validClass,
            invalid = this.options.invalidClass,
            required = this.options.requiredClass,
            allClasses = valid + ' ' + invalid + ' ' + required;

        $field.removeClass( allClasses );
        if ( state == 'required' || state == 'invalid' ) {
            if ( state == 'invalid' ) {
                $field.addClass( invalid );
            } else {
                $field.addClass( required );
                var requiredOnly = true;
            }
            if ( this.errorSensitivity != 'low' ) {
                var self = this,
                    event;
                if ( this.errorSensitivity == 'high' ) {
                    event = 'keyup';
                } else {
                    //medium
                    event = 'blur';
                }

                if ( !$field.data( 'error-state' ) ) {
                    $field.data( 'error-state', true );
                    $field.on( event, 'input, textarea', function() {
                        self._validate( $field, requiredOnly );
                    });
                }
            }
            return false;
        }
        if ( $field.data( 'error-state' ) ) {
            if ( this.errorSensitivity == 'high' ) {
                if ( this.event != 'keyup' ) {
                    $field.data( 'error-state', false ).find( 'input, textarea' ).unbind( 'keyup' );
                }
            } else if ( this.errorSensitivity == 'medium' ) {
                //medium
                if ( this.event != 'blur' ) {
                    $field.data( 'error-state', false ).find( 'input, textarea' ).unbind( 'blur' );
                }
            }
        }
        $field.addClass( valid );
        return true;
    }
});

WebPro.Widget.addWidgetConstructorAsjQueryPlugin( 'wpForm', Form );

$.fn.serializeObject = function() {
    var o = {};
    var a = this.serializeArray();
    $.each( a, function() {
        if ( o[ this.name ] !== undefined ) {
            if ( !o[ this.name ].push ) {
                o[ this.name ] = [ o[ this.name ] ];
            }
            o[ this.name ].push( this.value || '' );
        } else {
            o[ this.name ] = this.value || '';
        }
    });
    return o;
};

var ReportAbuse = {};

var $body = $( 'body' );
var $doc = $( document );
var reportAbuseShowClass = 'show';
var spinnerShowClass = 'show';
var bannerShowClass = 'show';
var animationEnd = 'animationend webkitAnimationEnd mozAnimationEnd MSAnimationEnd oAnimationEnd';
var $successBanner;
var $errorBanner;
var $reportDialog;
var $reportAbuseLink;
var $reportAbuseCloseCancel;
var $reportAbuseForm;
var $spinnerModal;

$.fn.customClick = function( fn, thisArg ) {
    this.on( 'click', function( evt ) {
        evt.preventDefault();
        fn.call( thisArg, evt );
    });
};

var ReportAbuse = {
    swapOutForm: function() {
        var formMarkup = templates.report_abuse;
        var style = '<style type="text/css">' + templates[ 'report_abuse.css' ] + '</style>';

        // Undo event handlers that will still be active after the DOM removal;
        $( '.bumper-section' ).off( 'click', '.js-report-abuse' );
        $doc.off( 'keyup' );

        $( '.js-report-success, .js-report-error, .js-report-abuse-form, .js-report-abuse-dialog, .report-abuse-dialog' ).remove();

        // Swap out markup
        $body.append( formMarkup );
        $body.append( style );


        // Point vars at the new elements
        $successBanner = $( '.js-report-success' );
        $errorBanner = $( '.js-report-error' );
        $reportDialog = $( '.js-report-abuse-dialog' );
        $reportAbuseLink = $( '.js-report-abuse' );
        $reportAbuseCloseCancel = $( '.js-report-abuse-close, .js-report-abuse-cancel' );
        $reportAbuseForm = $( '.js-report-abuse-form' );
        $spinnerModal = $( '.js-spinner-modal' );
    },

    init: function() {
        var self = this;
        self.swapOutForm();

        $doc.on( 'keyup', this.onKeyUp.bind( this ) );
        $( '.bumper-section, .spark-bumper-section' ).on( 'click', '.js-report-abuse', function( evt ) {
            evt.preventDefault();
            self.onReportAbuseClick( evt );
        });
        $reportAbuseCloseCancel.customClick( this.onCloseCancelClick, this );
        $reportAbuseForm.wpForm({
            validationEvent: 'blur',
            errorStateSensitivity: 'high',
            formSubmittedClass: 'form-submitted',
            // set to false to let custom submit handler actually post the form
            ajaxSubmit: false,
            onSubmit: this.onAbuseSubmit
        });
        $successBanner.on( animationEnd, this.onBannerAnimationEnd.bind( this ) );
        $errorBanner.on( animationEnd, this.onBannerAnimationEnd.bind( this ) );
    },

    onReportAbuseClick: function( evt ) {
        $reportDialog.addClass( reportAbuseShowClass );
    },

    onCloseCancelClick: function( evt ) {
        this.closeDialogs();
    },

    onKeyUp: function( evt ) {
        if ( evt.which == 27 ) {
            this.escape();
        }
    },

    onAbuseSubmit: function( evt ) {
        var $this = $( this );
        evt.preventDefault();

        var hash = window.location.pathname;
        var hostname = Luca.backendHostname;
        var data = $this.serializeObject();

        if ( hash.search ( /^\/(a|assets|cp|page)\// ) != -1 ) {
            hash = hash.split( '/' )[ 2 ];
        }

        var url = 'https://' + hostname +
            '/api/v2/slate/assets/' +
            hash +
            '/report';
        data.date = new Date().toISOString();
        data.language = 'en_US';
        data.metadata = {
            url: window.location.href
        };

        $.ajax({
            type: 'POST',
            url: url,
            data: JSON.stringify( data ),
            contentType: 'application/json',
            processData: false,
            beforeSend: function( xhr ) {
                xhr.setRequestHeader( 'X-Api-Key', 'MarvelWeb1' );
                $spinnerModal.addClass( spinnerShowClass );
            }
        })
        .done( function( data, status, xhr ) {
            $spinnerModal.removeClass( spinnerShowClass );
            if ( status != 'success' ) {
                $errorBanner.addClass( bannerShowClass );
                ReportAbuse.closeDialogs();
                return;
            }

            $successBanner.addClass( bannerShowClass );
            ReportAbuse.closeDialogs();
        })
        .fail( function() {
            $spinnerModal.removeClass( spinnerShowClass );
            $errorBanner.addClass( bannerShowClass );
            ReportAbuse.closeDialogs();
        })
    },

    onBannerAnimationEnd: function( evt ) {
        $successBanner.removeClass( bannerShowClass );
        $errorBanner.removeClass( bannerShowClass );
    },

    escape: function() {
        this.closeDialogs();
    },

    closeDialogs: function() {
        $reportDialog.removeClass( reportAbuseShowClass );
    }
};

module.exports = ReportAbuse;

},{"../../dist/chrome/templates":9}],6:[function(require,module,exports){
Luca.registerSectionsArticleHandler( 'spark-bumper', $.extend( {}, Luca.GenericSectionArticleHandler, {
    _initialize: function( sectionEle, options ) {
        var $section = $( sectionEle );
        var sectionTimeline = $section.data( 'timeline' );

        var transform = Luca.vendorPrefix + 'transform';
        var transformOrigin = Luca.vendorPrefix + 'transform-origin';

        var $content = $section.find( '.bumper-content' );
        var $footer = $section.find( '.footer' );

        var $logo = $content.find( '.logo' );
        var $madeWith = $content.find( '.made-with' );
        var $sparkPage = $content.find( '.adobe-spark-page' );
        var $tagline = $content.find( '.tag-line' );

        var $button = $content.find( '.button' );
        var $learnMore = $content.find( '.learn-more.block' );

        var props = options.props;
        var isUnder = props.layer === -1;
        var sectionHeight = props.height;
        var halfHeight = sectionHeight >> 1;
        var quarterHeight = halfHeight >> 1;

        // Get the center of the area that contains the made-with, spark-page and logo.

        var mDim = this._getGeometry( $madeWith );
        var sDim = this._getGeometry( $sparkPage );
        var lDim = this._getGeometry( $logo );
        var tDim = this._getGeometry( $tagline );
        var bDim = this._getGeometry( $button );
        var lmDim = this._getGeometry( $learnMore );

        var centerX = ( Math.max( mDim.x2, sDim.x2, lDim.x2 ) - Math.min( mDim.x, sDim.x, lDim.x ) ) >> 1;
        var centerY = ( Math.max( mDim.y2, sDim.y2, lDim.y2 ) - Math.min( mDim.y, sDim.y, lDim.y ) ) >> 1;

        // The section that precedes the bumper can be over (uncover) or on the same
        // layer (pulled) as the bumper, we have to account for the difference in movement
        // of the section-view that can occur. To simplify things, we will generate our
        // parameters and animations with the assumption that the section is being "pulled"
        // into view. We'll animate the content container in the 'under' layer case so that
        // the content inside it looks like it is being pulled in, allowing us to the use
        // the exact same parameters and tweens in both cases.

        if ( isUnder ) {
            sectionTimeline.translateY( $content, 0, sectionHeight, sectionHeight + 'px', '0px' );
        }

        // Animate the scaling of the logo and made-with text.

        sectionTimeline.scale( $madeWith, 0, halfHeight, '0', '1' );
        sectionTimeline.translateY( $madeWith, 0, halfHeight, -centerY + 'px', '0px' );

        sectionTimeline.scale( $logo, 0, halfHeight, '0', '1' );
        sectionTimeline.translateY( $logo, 0, halfHeight, -centerY + 'px', '0px' );

        sectionTimeline.scale( $sparkPage, 0, halfHeight, '0', '1' );
        sectionTimeline.translateY( $sparkPage, 0, halfHeight, -centerY + 'px', '0px' );

        // Fade in the tagline, butotn and learn-more link.

        var tDY = Math.max( sDim.y2, lDim.y2 ) - tDim.y;
        var bDY = tDim.y2 - bDim.y + 4;
        var lmDY = tDim.y2 + bDim.height - lmDim.y + 4;

        sectionTimeline.translateY( $tagline, halfHeight, quarterHeight, tDY + 'px', '0px' );
        sectionTimeline.opacity( $tagline, halfHeight, quarterHeight, 0, 1 );

        sectionTimeline.translateY( $button, halfHeight + quarterHeight, quarterHeight, bDY + 'px', '0px' );
        sectionTimeline.opacity( $button, halfHeight + quarterHeight, quarterHeight, 0, 1 );

        sectionTimeline.translateY( $learnMore, halfHeight + quarterHeight, quarterHeight, lmDY + 'px', '0px' );
        sectionTimeline.opacity( $learnMore, halfHeight + quarterHeight, quarterHeight, 0, 1 );

        // The footer animates in a way that gives the appearance of moving slower than
        // the section. This gives the appearance of the section stretching, and some resistance
        // of the footer to come into view.

        if ( $footer.length > 0 ) {
            sectionTimeline.translateY( $footer, halfHeight, halfHeight, $footer[ 0 ].offsetHeight - ( isUnder ? 0 : halfHeight ) + 'px', '0px' );
        }

        // Initialize the elements we are animating so that they are in their
        // default positions and ready to go.

        $madeWith
            .css( transformOrigin, ( centerX - mDim.x ) + 'px ' + ( centerY - mDim.y ) + 'px' );

        $logo
            .css( transformOrigin, ( centerX - lDim.x ) + 'px ' + ( centerY - lDim.y ) + 'px' );

        $sparkPage
            .css( transformOrigin, ( centerX - sDim.x ) + 'px ' + ( centerY - sDim.y ) + 'px' );

        var tDY = Math.max( sDim.y2, lDim.y2 ) - tDim.y;
        var bDY = tDim.y2 - bDim.y + 4;
        var lmDY = tDim.y2 + bDim.height - lmDim.y + 4;

        $tagline
            .css( transform, 'translate3d(0,' + tDY + 'px,0)')
            .css( 'opacity', '0' );

        $button
            .css( transform, 'translate3d(0,' + bDY + 'px,0)')
            .css( 'opacity', '0' );

        $learnMore
            .css( transform, 'translate3d(0,' + lmDY + 'px,0)')
            .css( 'opacity', '0' );


        $footer.css( transform, 'translate3d(0,' + ( isUnder ? $footer[ 0 ].offsetHeight : 0 ) + 'px,0)');
    },

    _getGeometry: function( $ele ) {
        var ele = $ele && $ele[ 0 ],
            rect = { x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0 };

        if ( ele ) {
            rect.width = ele.offsetWidth;
            rect.height = ele.offsetHeight;
            rect.x = ele.offsetLeft;
            rect.y = ele.offsetTop;
            rect.x2 = rect.x + rect.width;
            rect.y2 = rect.y + rect.height;
        }

        return rect;
    }
}));

},{}],7:[function(require,module,exports){
Luca.registerSectionsArticleHandler( 'spark-header', $.extend( {}, Luca.GenericSectionArticleHandler, {
    transformMarkup: function( sectionEle ) {
        var $section = $( sectionEle ),
            $article = $section.closest( '.article' ),
            articleHeight = $article.height(),
            sectionHeight = $section.height(),
            $title = $section.siblings( '.title-section' );

        // Adjust the title section height so that it fills up the space
        // below the header.

        $title.height( articleHeight - sectionHeight );

        // Adjust the title-section's layer setting so that it pushes our
        // header out of view when we scroll.

        $title.data( 'layer', 0 );
    }
}));

Luca.SparkFloatingHeader = function( headerEle, options ) {
    this.options = $.extend( {}, this.defaultOptions, options );
    this.$element = $( headerEle );
    this.$article = this.$element.closest( '.article' );
    this.$createLinks = this.$element.eq( 1 );
    this.lastScrollPosition = 0;
    this.showReason = '';

    var widget = this;
    var animator = this.$article.data( 'animator' );

    // auto hide at startup
    setTimeout(function() {
            widget.hide();
        }, this.options.initialShowTime );

    // show the bar on hover
    $( document ).on( 'vmousemove', $.proxy( this._handleMouseMove, this ) );


    // show a list of links when clicking the create your own button
    this.$element.find( '.create-your-own.button' ).on( 'vclick', function( event ){
        this.$createLinks.addClass( 'open' );
        return false;
    }.bind( this ));

    this.$createLinks.on( 'vclick', function( event ){
        this.$createLinks.removeClass( 'open' );
    }.bind( this ));

    animator.$element.on( 'article-scroll', $.proxy( this._handleArticleScroll, this ) );
}

$.extend( Luca.SparkFloatingHeader.prototype, {
    defaultOptions: {
        initialShowTime:       3000,
        backtrackDistance:     100,
        showClassName:         'show',
        aboveTheFoldClassName: 'above-the-fold'
    },

    show: function( reason ) {
        this.showReason = reason;
        this.$element.addClass( this.options.showClassName );
    },

    hide: function() {
        // don't hide the header while the create dialog is open
        if ( this.$createLinks.hasClass( 'open' ) ) {
            return;
        }

        this.showReason = '';
        this.$element.removeClass( this.options.showClassName );
    },

    _setupAnalytics: function() {
            // Analytics
            var scPageName = 'adb.page.pageinfo.pagename';
            var scProductCategory = 'adb.page.pageinfo.productcategory';
            var scSourceApp = 'adb.sourceapp.value';
            var scNamespace = 'adb.page.pageInfo.namespace';
            var scLanguage = 'adb.page.pageInfo.language';
            var scAction = 'a.action';

            // this is the hash of the page
            var scPageValue = 'adb.page.value';
            var scPageViewed = 'adb.page.viewed';
            var scPageURL = 'adb.page.pageinfo.pageurl';

            var Analytics = {
                init: function() {
                    s.contextData[ scPageURL ] = document.location.href;
                    s.contextData[ scProductCategory ] = 'PUBSERVER';
                    s.contextData[ scSourceApp ] = 'slate';
                    s.contextData[ scNamespace ] = 'pubserver';
                    s.contextData[ scLanguage ] = 'en_US';
                    s.trackOffline = true;

                    // clear out 'action' and 'pagename' before every call and set if needed
                    s.contextData[ scAction ] = '';
                    s.contextData[ scPageName ] = '';
                    s.contextData[ scPageValue ] = '';
                },

                setHash: function() {
                    var url = document.location.href;
                    var urlArr = url.split( '/' );
                    var hash = urlArr[ urlArr.length - 1 ];
                    hash = hash.split( '?' )[ 0 ].split( '#' )[ 0 ]; //remove all query and hash params
                    s.contextData[scPageValue] = hash;
                },

                clickCreateYourOwn: function() {
                    this.init();
                    this.setHash();
                    s.tl( this, 'o', 'create-your-own' );
                }
        };

        this.$element.find( '.create-your-own' ).on( 'click', function( e ) {
            Analytics.clickCreateYourOwn();
        });
    },

    _handleMouseMove: function( e ) {
        if ( e.pageY <= this.$element.height() ){
            this.show( 'mousemove' );
        } else if ( this.showReason == 'mousemove' ){
            this.hide();
        }
    },

    _handleArticleScroll: function( e ) {
        var viewportHeight = this.$article.height();
        var animator = this.$article.data( 'animator' );

        if ( animator ) {
            var newScrollPosition = animator.scrollTop();
            var distanceDelta = newScrollPosition - this.lastScrollPosition;

            // detect if we're above the fold or not
            if ( newScrollPosition < viewportHeight ){
                this.$element.addClass( this.options.aboveTheFoldClassName );
            } else {
                this.$element.removeClass( this.options.aboveTheFoldClassName );
            }

            // only show the bar if you scroll back a certain distance
            if ( distanceDelta < 0 ){
                if ( landmarkScrollPosition < 0 ){
                    landmarkScrollPosition = newScrollPosition;
                }

                if ( landmarkScrollPosition - newScrollPosition > this.options.backtrackDistance ){
                    this.show();
                }
            } else if ( distanceDelta > 0 ){
                landmarkScrollPosition = -1;
                this.hide();
            }

            this.lastScrollPosition = newScrollPosition;
        }
    }
});


},{}],8:[function(require,module,exports){
module.exports = {
    sameDomainIframe: function() {
        try {
            return window.top && window.top != window.self && window.top.location.host == window.location.host;
        } catch (err) {
            return false;
        }
    },

    isSparkBranded: function() {
        return !window.brandType || window.brandType === 'default';
    },

    isUnBranded: function() {
        return window.brandType && window.brandType === 'none';
    },

    isCustomBranded: function() {
        return window.brandType && window.brandType === 'brandkit';
    },

    isIOS: function() {
        return window.navigator.userAgent.search( /ipad|iphone|ipod/i ) >= 0;
    },

    isMobile: function() {
        return window.navigator.userAgent.search( /mobile/i ) >= 0;
    },

    iOSSample: function() {
        var queryParams = WebPro.Utils.parseQueryParams( window.location.toString() );
        return queryParams.trackingId == 'iPadExplore' || queryParams.trackingId == 'iPhoneExplore';
    },

    isValidURL: function ( url ) {

        //
        // Regular Expression for URL validation
        //
        // Author: Diego Perini
        // Updated: 2010/12/05
        // License: MIT
        //
        // Copyright (c) 2010-2013 Diego Perini (http://www.iport.it)
        //
        // Permission is hereby granted, free of charge, to any person
        // obtaining a copy of this software and associated documentation
        // files (the "Software"), to deal in the Software without
        // restriction, including without limitation the rights to use,
        // copy, modify, merge, publish, distribute, sublicense, and/or sell
        // copies of the Software, and to permit persons to whom the
        // Software is furnished to do so, subject to the following
        // conditions:
        //
        // The above copyright notice and this permission notice shall be
        // included in all copies or substantial portions of the Software.
        //
        // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
        // EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
        // OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
        // NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
        // HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
        // WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
        // FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
        // OTHER DEALINGS IN THE SOFTWARE.
        //
        // the regular expression composed & commented
        // could be easily tweaked for RFC compliance,
        // it was expressly modified to fit & satisfy
        // these test for an URL shortener:
        //
        //   http://mathiasbynens.be/demo/url-regex
        //
        // Notes on possible differences from a standard/generic validation:
        //
        // - utf-8 char class take in consideration the full Unicode range
        // - TLDs have been made mandatory so single names like "localhost" fails
        // - protocols have been restricted to ftp, http and https only as requested
        //
        // Changes:
        //
        // - IP address dotted notation validation, range: 1.0.0.0 - 223.255.255.255
        //   first and last IP address of each class is considered invalid
        //   (since they are broadcast/network addresses)
        //
        // - Added exclusion of private, reserved and/or local networks ranges
        //
        // - Made starting path slash optional (http://example.com?foo=bar)
        //
        // - Allow a dot (.) at the end of hostnames (http://example.com.)
        //
        // Compressed one-line versions:
        //
        // Javascript version
        //
        // /^(?:(?:https?|ftp):\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,}))\.?)(?::\d{2,5})?(?:[/?#]\S*)?$/i
        //
        // PHP version
        //
        // _^(?:(?:https?|ftp)://)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\x{00a1}-\x{ffff}0-9]-*)*[a-z\x{00a1}-\x{ffff}0-9]+)(?:\.(?:[a-z\x{00a1}-\x{ffff}0-9]-*)*[a-z\x{00a1}-\x{ffff}0-9]+)*(?:\.(?:[a-z\x{00a1}-\x{ffff}]{2,}))\.?)(?::\d{2,5})?(?:[/?#]\S*)?$_iuS
        //
        var reWebUrl = new RegExp(
            "^" +
                // protocol identifier
                "(?:(?:https?|ftp)://)" +
                // user:pass authentication
                "(?:\\S+(?::\\S*)?@)?" +
                "(?:" +
                    // IP address exclusion
                    // private & local networks
                    "(?!(?:10|127)(?:\\.\\d{1,3}){3})" +
                    "(?!(?:169\\.254|192\\.168)(?:\\.\\d{1,3}){2})" +
                    "(?!172\\.(?:1[6-9]|2\\d|3[0-1])(?:\\.\\d{1,3}){2})" +
                    // IP address dotted notation octets
                    // excludes loopback network 0.0.0.0
                    // excludes reserved space >= 224.0.0.0
                    // excludes network & broacast addresses
                    // (first & last IP address of each class)
                    "(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])" +
                    "(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}" +
                    "(?:\\.(?:[1-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))" +
                "|" +
                    // host name
                    "(?:(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)" +
                    // domain name
                    "(?:\\.(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)*" +
                    // TLD identifier
                    "(?:\\.(?:[a-z\\u00a1-\\uffff]{2,}))" +
                    // TLD may end with dot
                    "\\.?" +
                ")" +
                // port number
                "(?::\\d{2,5})?" +
                // resource path
                "(?:[/?#]\\S*)?" +
            "$", "i"
        );

        var reMailto = /^mailto\:[^\@]+\@[^\@]+/;
        var rePhone = /^tel\:[\d\s\(\)\-\+]+/;
        var httpUrl = 'http://' + url;
        var protocolLessHttpUrl = 'http:' + url;

        return reWebUrl.test( url ) ||
               reWebUrl.test( httpUrl ) ||
               reWebUrl.test( protocolLessHttpUrl ) ||
               reMailto.test( url ) ||
               rePhone.test (url );
    },

    getBasicURLInfo: function ( url ) {
        var output = {};
        output.valid = this.isValidURL( url );
        output.absoluteURL = url;

        // prepend http:// to urls that aren't already absolute
        if ( url && !/^(([A-Za-z]+:)|\/\/)/.test( url ) ) {
            output.absoluteURL = 'http://' + url;
        }

        return output;
    },

    validateLinkURL: function ( url ) {
        var urlInfo = this.getBasicURLInfo( url );
        return urlInfo.valid ? urlInfo.absoluteURL : '';
    }
};

},{}],9:[function(require,module,exports){
module.exports = {
    "bar.css" : '.topbar {position: fixed;top: -60px;left: 0;right: 0;height: 60px;background: rgba(0,0,0,0.4);-webkit-transition: top 0.3s, background 0.5s; -moz-transition: top 0.3s, background 0.5s;-ms-transition: top 0.3s, background 0.5s; -o-transition: top 0.3s, background 0.5s;transition: top 0.3s, background 0.5s;color: white;font-family: adobe-clean, sans-serif;z-index: 1;}.topbar:before {content: \'\';position: absolute;left: 0;top: 0;right: 0;height: 100px;background: none;-webkit-transition: background 0.5s; -moz-transition: background 0.5s;-ms-transition: background 0.5s; -o-transition: background 0.5s;transition: background 0.5s;}.topbar.show {top: 0;}.topbar.above-the-fold {background: none;}.topbar.above-the-fold:before {background: rgba(0,0,0,0.6);background: -moz-linear-gradient(top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 85%);background: -webkit-gradient(left top, left bottom, color-stop(0%, rgba(0,0,0,0.6)), color-stop(85%, rgba(0,0,0,0)));background: -webkit-linear-gradient(top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 85%);background: -o-linear-gradient(top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 85%);background: -ms-linear-gradient(top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 85%);background: linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 85%);}.topbar .logo {position: absolute;left: 15px;height: 100%;padding-left: 50px;background-image: url(https://s3.amazonaws.com/adobe-luca-prod-ue1-assets/experiments/base/logo.png);background-repeat: no-repeat;background-position: left;background-size: 41px 40px;}.topbar .logo:before {content: "";display: inline-block;height: 100%;width: 1px;vertical-align: middle;}.topbar .logo span {display: inline-block;vertical-align: middle;padding-top: 0px;font-size: 1.25rem;font-weight: 300;}.topbar .action {position: absolute;right: 32px;top: 0;height: 100%;text-align: right;width: 50%;}.topbar .action:before {content: \'\';display: inline-block;vertical-align: middle;height: 100%;width: 0;}.topbar .action a {display: inline-block;vertical-align: middle;color: rgba(255,255,255,0.75);border: 1px solid rgba(255,255,255,0.75);text-decoration: none;font-weight: 300;font-size: 0.9rem;padding: 8px 20px 10px 20px;border-radius: 5px;margin-left: 10px;-webkit-transition: color 0.3s, border-color 0.3s; -moz-transition: color 0.3s, border-color 0.3s;-ms-transition: color 0.3s, border-color 0.3s; -o-transition: color 0.3s, border-color 0.3s;transition: color 0.3s, border-color 0.3s;}.topbar .action a:hover {color: rgba(255,255,255,1);border-color: rgba(255,255,255,1);}/* iPhone */@media only screen and (max-width: 480px),screen and (min-device-width : 320px) and (max-device-width : 568px) and (orientation : landscape) {.topbar {top: -40px;height: 40px;}.topbar .logo {padding-left: 37px;background-size: 30px 30px;}.topbar .logo span {font-size: 2rem;}.topbar .action a {padding: 4px 10px 5px 10px;font-size: 1.2rem;}}',"bar" : '<div class="topbar show above-the-fold"><div class="logo"><span>Adobe Slate</span></div><div class="action"><a class="create-your-own" href="https://slate.adobe.com{{# path }}{{ path }}{{/ path }}/?r={{ trackingId }}{{# postPath }}{{ postPath }}{{/ postPath }}" target="_blank">{{ buttonText }}</a></div></div>',"brand_bumper" : '<div class="section bumper-section branded-bumper-section{{# section_class }} {{{ section_class }}}{{/ section_class }}"{{# layerName }} data-layer-name="{{ layerName }}"{{/ layerName }}{{# layer }} data-layer="{{ layer }}"{{/ layer }}><div class="section-view"><div class="brand-content">{{# brandUrl }}{{# hasBrandLogo }}<a class="logo" rel="nofollow noreferrer" href="{{ brandUrl }}"></a>{{/ hasBrandLogo }}{{^ hasBrandLogo }}<a class="no-logo" rel="nofollow noreferrer" href="{{ brandUrl }}">{{ brandName }}</a>{{/ hasBrandLogo }}{{/ brandUrl }}{{^ brandUrl }}{{# hasBrandLogo }}<span class="logo"></span>{{/ hasBrandLogo }}{{^ hasBrandLogo }}<span class="no-logo">{{ brandName }}</span>{{/ hasBrandLogo }}{{/ brandUrl }}{{# hasSocialUrls }}<div class="social-links">{{# facebookUrl }}<a target="_blank" rel="nofollow noreferrer" style=\'background-image:url(data:image/svg+xml;base64,{{{ facebookIcon }}})\' class="social-link facebook" href="{{ facebookUrl }}"></a>{{/ facebookUrl }}{{# twitterUrl }}<a target="_blank" rel="nofollow noreferrer" style=\'background-image:url(data:image/svg+xml;base64,{{{ twitterIcon }}})\' class="social-link facebook" href="{{ twitterUrl }}"></a>{{/ twitterUrl }}{{# instagramUrl }}<a target="_blank" rel="nofollow noreferrer" style=\'background-image:url(data:image/svg+xml;base64,{{{ instagramIcon }}})\' class="social-link instagram" href="{{ instagramUrl }}"></a>{{/ instagramUrl }}</div>{{/ hasSocialUrls }}{{# brandCTAEnabled }}{{# brandCTA }}{{# brandCTAUrl }}<div class="actions"><a class="call-to-action button{{# brandCTAButtonStyle }} {{ brandCTAButtonStyle }}{{/ brandCTAButtonStyle }}" rel="nofollow noreferrer" href="{{ brandCTAUrl }}">{{ brandCTA }}</a></div>{{/ brandCTAUrl }}{{/ brandCTA }}{{/ brandCTAEnabled }}</div><div class="footer"> <a class="tos" target="_blank" href="http://www.adobe.com/legal/terms.html" rel="nofollow">Terms &amp; Conditions</a> <a class="privacy" target="_blank" href="http://www.adobe.com/go/privacy" rel="nofollow">Privacy Policy</a> <a class="js-report-abuse" href="#" target="_blank" rel="nofollow">Report Abuse</a></div></div></div>',"brand_embedded_style.css" : '{{^ brand_disable_style }}/* BRAND KIT SPLASH */.splash .loading-label {font-family: adobe-clean, sans-serif;font-weight: bold;font-size: 20px;letter-spacing: .25em;text-transform: uppercase;color: {{ splashLoadingLabelColor }};text-shadow: 0 0 2px rgba(144,144,144,0.3); /* #909090 30% */}.splash .title {margin-bottom: 1em;font-family: adobe-clean, sans-serif;font-size: 42px;text-transform: uppercase;color: {{ splashTextColor }};}.splash .wp-progress-bar {border-color: rgba(255,255,255,.3);background-color: rgba(255,255,255,.25);box-shadow: 1px 1px 4px rgba(0,0,0,.25);}.splash .wp-progress-bar-view {background-color: {{ splashProgressBarColor }};}.splash .logo {background-image: url({{{ splashLogo }}});background-repeat: no-repeat;background-position: bottom center;width: 200px;height: 80px;top: -150px;}/* BRAND KIT HEADER */.brand-header {font-family: adobe-clean, sans-serif;}.brand-header .logo {background-image: url({{{ headerLogo }}});}.brand-header .no-logo {display: inline-block;vertical-align: middle;font-size: 1.8rem;line-height: 1em;font-family: adobe-clean, sans-serif;color: {{ ctaBkgColor }};}.brand-header .actions .button {background-color: {{ ctaBkgColor }};color: {{ ctaTextColor }};font-family: proxima-nova, adobe-clean, sans-serif;font-size: 14px;font-weight: 400;}.brand-header .actions .button.rect {border-radius: 0;}.brand-header .actions .button.rounded {border-radius: 5px;}.brand-header .actions .button.pill {border-radius: 21px;}.brand-header .actions .button.brand-cta-rounded {border-radius: 4px;}.brand-header .actions .button.brand-cta-pill {border-radius: 1000px;}{{# ctaBkgHoverColor }}.brand-header .actions .button:hover {background-color: {{ ctaBkgHoverColor }};}{{/ ctaBkgHoverColor }}{{# ctaBkgActiveColor }}.brand-header .actions .button:active {background-color: {{ ctaBkgActiveColor }};}{{/ ctaBkgActiveColor }}.brand-header.floater {background-color: {{ headerBkgFloaterColor }};border-bottom: solid 1px rgba(220,224,227,0.5);}.brand-header.floater.above-the-fold {border-bottom: solid 1px rgba(220,224,227,0);}.brand-header.floater.above-the-fold:before {background: rgba(0,0,0,.6);background: -moz-linear-gradient(top,rgba(0,0,0,.6) 0,rgba(0,0,0,0) 85%);background: -webkit-gradient(left top,left bottom,color-stop(0,rgba(0,0,0,.6)),color-stop(85%,rgba(0,0,0,0)));background: -webkit-linear-gradient(top,rgba(0,0,0,.6) 0,rgba(0,0,0,0) 85%);background: -o-linear-gradient(top,rgba(0,0,0,.6) 0,rgba(0,0,0,0) 85%);background: -ms-linear-gradient(top,rgba(0,0,0,.6) 0,rgba(0,0,0,0) 85%);background: linear-gradient(to bottom,rgba(0,0,0,.6) 0,rgba(0,0,0,0) 85%);}.brand-header-section {background-color: {{ headerBkgSectionColor }};}.brand-header-section .actions .button {font-size: 12px;}/* BRAND KIT BUMPER */.sections-article-layout .branded-bumper-section {background-color: {{ bumperBkgColor }};}.sections-article-layout .branded-bumper-section .brand-content .logo {background-image: url({{{ bumperLogo }}});width: 200px;height: 80px;}.sections-article-layout .branded-bumper-section .brand-content .no-logo {display: inline-block;font-size: 1.8rem;line-height: 1em;font-family: adobe-clean, sans-serif;color: {{ ctaTextColor }};}.sections-article-layout .branded-bumper-section .brand-content .logo,.sections-article-layout .branded-bumper-section .brand-content .no-logo {margin-bottom: 45px;}.sections-article-layout .branded-bumper-section .footer {padding-top: 15px;padding-bottom: 15px;}.sections-article-layout .branded-bumper-section .footer a {color: {{ bumperTOSColor }};font-family: adobe-clean, sans-serif;font-size: 12px;font-weight: 300;}.branded-bumper-section .social-links {margin-bottom: 30px;}.branded-bumper-section .social-link {display: inline-block;margin: 0 5px;width: 32px;height: 32px;font-family: adobe-clean, sans-serif;font-weight: bold;line-height: 32px;background-repeat: no-repeat;background-position: center;background-size: contain;}.branded-bumper-section .actions {}.sections-article-layout .branded-bumper-section .brand-content {padding-top: 60px;padding-bottom: 53px;}.sections-article-layout .branded-bumper-section .brand-content .button {border-color: {{ bumperTextColor }};color: {{ bumperTextColor }};font-family: proxima-nova, adobe-clean, sans-serif;border-width: 1px;border-style: solid;text-decoration: none;display: inline-block;padding: 0 20px;font-size: 15px;line-height: 36px;font-weight: 400;}.sections-article-layout .branded-bumper-section .brand-content .button.rect {border-radius: 0;}.sections-article-layout .branded-bumper-section .brand-content .button.rounded {border-radius: 5px;}.sections-article-layout .branded-bumper-section .brand-content .button.pill {border-radius: 21px;}{{/ brand_disable_style }}',"brand_header" : '<div class="section brand-header-section" data-section-behavior="brand-header" data-layer-name="over"><div class="section-view"><div class="brand-header"><div class="branding">{{# brandUrl }}{{# hasBrandLogo }}<a class="logo" rel="nofollow noreferrer" href="{{ brandUrl }}"></a>{{/ hasBrandLogo }}{{^ hasBrandLogo }}<a class="no-logo" rel="nofollow noreferrer" href="{{ brandUrl }}">{{ brandName }}</a>{{/ hasBrandLogo }}{{/ brandUrl }}{{^ brandUrl }}{{# hasBrandLogo }}<span class="logo"></span>{{/ hasBrandLogo }}{{^ hasBrandLogo }}<span class="no-logo">{{ brandName }}</span>{{/ hasBrandLogo }}{{/ brandUrl }}</div>{{# brandCTAEnabled }}<div class="actions">{{# brandCTA }}{{# brandCTAUrl }}<a class="call-to-action button{{# brandCTAButtonStyle }} {{ brandCTAButtonStyle }}{{/ brandCTAButtonStyle }}" rel="nofollow noreferrer" href="{{ brandCTAUrl }}">{{ brandCTA }}</a>{{/ brandCTAUrl }}{{/ brandCTA }}</div>{{/ brandCTAEnabled }}</div></div></div>',"brand_splash" : '<div id="luca-splash" class="splash">{{# splash }}{{# image }}<div class="background"{{# image.src }} style="background-image: url({{{ image.src }}});{{# image.align}} background-position: {{{ image.align }}};{{/ image.align }}"{{/ image.src }}></div>{{/ image }}{{/ splash }}<div class="content"><div class="logo"></div><div class="loading-label">Loading</div><div class="wp-progress-bar"><div class="wp-progress-bar-clip"><div class="wp-progress-bar-view"></div></div></div></div></div>',"icon_facebook.svg" : '<svg version="1.1" id="Icons" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 32 32" width="32" height="32" style="enable-background:new 0 0 32 32;" xml:space="preserve"><style type="text/css">.st0{fill:{{FILL_COLOR}};{{# FILL_OPACITY }}fill-opacity: {{ FILL_OPACITY }}{{/ FILL_OPACITY }}}</style><path class="st0" d="M16,0C7.2,0,0,7.2,0,16s7.2,16,16,16s16-7.2,16-16S24.8,0,16,0z M19.4,16h-2.2v8h-3.3v-8h-1.6v-2.8h1.6v-1.8 C13.7,9.6,15,8.1,16.7,8c0.2,0,0.3,0,0.5,0h2.5v2.7h-1.8c-0.4,0-0.7,0.3-0.7,0.7c0,0,0,0.1,0,0.1v1.7h2.5L19.4,16z"/></svg>',"icon_instagram.svg" : '<svg version="1.1" id="Icons" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 32 32" width="32" height="32" style="enable-background:new 0 0 32 32;" xml:space="preserve"><style type="text/css">.st0{fill:{{FILL_COLOR}};{{# FILL_OPACITY }}fill-opacity: {{ FILL_OPACITY }}{{/ FILL_OPACITY }}}</style><path class="st0" d="M16,19.2c1.8,0,3.2-1.4,3.2-3.2c0-1.8-1.4-3.2-3.2-3.2c-1.8,0-3.2,1.4-3.2,3.2C12.8,17.8,14.2,19.2,16,19.2z M16,0C7.2,0,0,7.2,0,16s7.2,16,16,16s16-7.2,16-16S24.8,0,16,0z M25.1,14.1v7.4c0,1.9-1.6,3.5-3.5,3.5l0,0H10.4 c-1.9,0-3.5-1.6-3.5-3.5l0,0V10.4c0-1.9,1.6-3.5,3.5-3.5h11.2c1.9,0,3.5,1.6,3.5,3.5l0,0V14.1z M21,16c0.1,2.8-2.1,5-4.9,5.1 s-5-2.1-5.1-4.9c0-0.7,0.1-1.4,0.4-2.1H8.7v7.4c0,1,0.8,1.7,1.7,1.7h11.2c1,0,1.7-0.8,1.7-1.7v-7.4h-2.7C20.9,14.7,21,15.4,21,16z M20,9.1h3v3h-3V9.1z"/></svg>',"icon_twitter.svg" : '<svg version="1.1" id="Icons" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 32 32" width="32" height="32" style="enable-background:new 0 0 32 32;" xml:space="preserve"><style type="text/css">.st0{fill:{{FILL_COLOR}};{{# FILL_OPACITY }}fill-opacity: {{ FILL_OPACITY }}{{/ FILL_OPACITY }}}</style><path class="st0" d="M16,0C7.2,0,0,7.2,0,16s7.2,16,16,16s16-7.2,16-16S24.8,0,16,0z M22.4,12.7c0,0.1,0,0.3,0,0.4 c0,5.2-4.2,9.3-9.4,9.3c-1.8,0-3.5-0.5-5-1.5c0.3,0,0.5,0,0.8,0c1.5,0,2.9-0.5,4.1-1.4c-1.4,0-2.6-0.9-3.1-2.3 c0.2,0,0.4,0.1,0.6,0.1c0.3,0,0.6,0,0.9-0.1c-1.5-0.3-2.6-1.7-2.6-3.2l0,0c0.5,0.3,1,0.4,1.5,0.4c-1.4-1-1.9-2.9-1-4.4 c1.7,2.1,4.1,3.3,6.8,3.4c-0.4-1.8,0.7-3.5,2.5-3.9c1.1-0.3,2.3,0.1,3.1,0.9c0.7-0.1,1.4-0.4,2.1-0.8c-0.2,0.8-0.8,1.4-1.4,1.8 c0.6-0.1,1.3-0.3,1.9-0.5C23.6,11.7,23,12.3,22.4,12.7z"/></svg>',"bumper" : '<!--BUMPER-SECTION-TOP-LEVEL-START--><div id="bumper-section" class="section bumper-section" data-section-behavior="bumper-grow-and-fade"{{# layer }} data-layer="{{{ layer }}}"{{/ layer }}{{# layerName }} data-layer-name="{{{ layerName }}}"{{/ layerName }}><div class="section-view"><!--BUMPER-CONTENT-START--><div class="bumper-content"><div class="bumper-content-container"><a data-analytics-get-slate class="logo" href="{{{ getUrl }}}"></a><div class="made-with"><p class="tagline">Made with <strong>Adobe Slate</strong></p><p>Make your words and images move.</p></div><a data-analytics-get-slate href="{{{ getUrl }}}" class="button">Get Slate</a></div></div><!--BUMPER-CONTENT-END--><!--FOOTER-START--><div class="footer"><span class="copyright">&copy; Adobe. All rights reserved.</span><span class="tos"><a target="_blank" href="http://www.adobe.com/go/slate-terms-of-use" rel="nofollow">Terms of Service</a></span><span class="privacy"><a target="_blank" href="http://www.adobe.com/go/privacy" rel="nofollow">Privacy Policy</a></span><span class="report-abuse"><a class="js-report-abuse" href="#" rel="nofollow">Report Abuse</a></span></div><!--FOOTER-END--></div></div><!--BUMPER-SECTION-TOP-LEVEL-END-->',"cookie_banner.css" : '.cookie-banner {background-color: rgba(255, 255, 255, 0.9);bottom: 0;font-family: adobe-clean,sans-serif;font-size: 14px;max-height: 100%;position: fixed;width: 100%;z-index: 100;}.cookie-banner.hiding {-webkit-animation: show 1s 0s, fadeOut 1s 1s;animation: show 1s 0s, fadeOut 1s 1s;opacity: 0;z-index: -1;}@-webkit-keyframes fadeOut {from { opacity: 1; z-index: 100; }to { opacity: 0; z-index: -1;}}@keyframes fadeOut {from { opacity: 1; z-index: 100; }to { opacity: 0; z-index: -1; }}@-webkit-keyframes show {from { opacity: 1; z-index: 100; }to { opacity: 1; z-index: 100;}}@keyframes show {from { opacity: 1; z-index: 100; }to { opacity: 1; z-index: 100; }}.cookie-banner .cookie-banner-view {position: relative;}.cookie-banner .cookie-banner-wrapper {align-items: center;display: flex;justify-content: center;margin-left: auto;margin-right: auto;padding: 14px 80px;}div.cookie-banner-text {color: rgb(53, 65, 76);font-family: adobe-clean,sans-serif;font-size: 13px;font-weight: 400;line-height: 1.5;margin-bottom: 0;margin-left: 5px;margin-right: 12px;margin-top: 0;}.cookie-banner .cookie-banner-cta {background-color: transparent;border-radius: 40px;border: 2px solid rgb(130,145,155);box-sizing: border-box;color: rgb(130,145,155);cursor: pointer;display: inline-block;font-family: adobe-clean,sans-serif;font-size: 14px;font-weight: 600;line-height: 1;padding: 8px 15px 9px 15px;position: relative;text-align: center;text-decoration: none;vertical-align: middle;width: auto;white-space: nowrap;-webkit-font-smoothing: antialiased;-webkit-transition: color .15s linear,border-color .15s linear;-moz-transition: color .15s linear,border-color .15s linear;-o-transition: color .15s linear,border-color .15s linear;-ms-transition: color .15s linear,border-color .15s linear;transition: color .15s linear,border-color .15s linear;}@media only screen and (max-width: 480px) {.cookie-banner {background-color: transparent;}.cookie-banner .cookie-banner-wrapper {margin-right: 0;margin-left: 0;padding: 0;position: relative;}.cookie-banner-text-wrapper {max-height: 100vh;position: relative;bottom: 60px;overflow: auto;}div.cookie-banner-text {background-color: rgba(255, 255, 255, 0.9);margin-right: 0;margin-left: 0;margin-top: 60px;padding: 14px 40px 0 40px;overflow: auto;}.cookie-banner .cookie-banner-cta {display: block;margin: 10px auto 0 auto;}.cookie-banner-cta-wrapper {background-color: rgba(255, 255, 255, 0.9);display: block;position: fixed;bottom: 0;left: 0;height: 60px;right: 0;}}',"cookie_banner" : '<div class="cookie-banner"><div class="cookie-banner-view"><!--BANNER-START--><div class="cookie-banner-wrapper"><div class="cookie-banner-text-wrapper"><div class="cookie-banner-text">{{#bannerText }}<p>{{.}}</p>{{/bannerText }}</div></div><div class="cookie-banner-cta-wrapper"><button class="cookie-banner-cta">{{ bannerCTA }}</button></div></div><!--BANNER-END--></div></div>',"google_analytics" : '<!-- Global site tag (gtag.js) - Google Analytics --><script async src="{{{ google_analytics_url }}}"></script><script>window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}gtag(\'js\', new Date());gtag(\'config\', \'{{ google_analytics_id }}\' );</script>',"report_abuse.css" : '.banner {font-family: adobe-clean, sans-serif;position: absolute;top: 0;left: 0;right: 0;z-index: 1;min-height: 75px;font-weight: 300;color: #FFFFFF;display: none;-webkit-box-align: center;-moz-box-align: center;box-align: center;-webkit-align-items: center;-moz-align-items: center;-ms-align-items: center;-o-align-items: center;align-items: center;-ms-flex-align: center;-webkit-box-pack: center;-moz-box-pack: center;box-pack: center;-webkit-justify-content: center;-moz-justify-content: center;-ms-justify-content: center;-o-justify-content: center;justify-content: center;-ms-flex-pack: center;}.banner a {color: #FFFFFF;}.banner.success {background-color: #147ACC;}.banner.error {background-color: #E20404;}.banner.show {display: -webkit-box;display: -moz-box;display: box;display: -webkit-flex;display: -moz-flex;display: -ms-flexbox;display: flex;opacity: 0;-webkit-animation: fadeOut 5s ease-in;-moz-animation: fadeOut 5s ease-in;animation: fadeOut 5s ease-in;}.banner .message {text-align: center;font-size: 1.1rem;}.banner .message a {color: #FFFFFF;text-decoration: underline;}@-webkit-keyframes fadeOut {0% {opacity: 1;}75% {opacity: 1;}100% {opacity: 0;}}@-moz-keyframes fadeOut {0% {opacity: 1;}75% {opacity: 1;}100% {opacity: 0;}}@keyframes fadeOut {0% {opacity: 1;}75% {opacity: 1;}100% {opacity: 0;}}@media only screen and (max-width: 480px) {.banner .message {font-size: 2.2rem;}}.spinner-modal {z-index: 2;display: none;position: absolute;top: 0;right: 0;bottom: 0;left: 0;background: rgba(255, 255, 255, 0.8);}.spinner-modal.show {display: block;}.spinner-modal-spinner {background-image: url(images/report-abuse-spinner.png);background-repeat: no-repeat;background-size: 100% 100%;width: 52px;height: 52px;-webkit-transition: -webkit-transform 0.75s;-moz-transition: -moz-transform 0.75s;transition: transform 0.75s;-webkit-animation: rotate 0.75s infinite linear;-moz-animation: rotate 0.75s infinite linear;animation: rotate 0.75s infinite linear;position: absolute;top: 50%;left: 50%;margin-top: -26px;margin-left: -26px;}@-webkit-keyframes rotate {from {-webkit-transform: rotate(0deg);-moz-transform: rotate(0deg);-ms-transform: rotate(0deg);-o-transform: rotate(0deg);transform: rotate(0deg);}to {-webkit-transform: rotate(360deg);-moz-transform: rotate(360deg);-ms-transform: rotate(360deg);-o-transform: rotate(360deg);transform: rotate(360deg);}}@-moz-keyframes rotate {from {-webkit-transform: rotate(0deg);-moz-transform: rotate(0deg);-ms-transform: rotate(0deg);-o-transform: rotate(0deg);transform: rotate(0deg);}to {-webkit-transform: rotate(360deg);-moz-transform: rotate(360deg);-ms-transform: rotate(360deg);-o-transform: rotate(360deg);transform: rotate(360deg);}}@keyframes rotate {from {-webkit-transform: rotate(0deg);-moz-transform: rotate(0deg);-ms-transform: rotate(0deg);-o-transform: rotate(0deg);transform: rotate(0deg);}to {-webkit-transform: rotate(360deg);-moz-transform: rotate(360deg);-ms-transform: rotate(360deg);-o-transform: rotate(360deg);transform: rotate(360deg);}}.report-abuse-dialog {font-family: adobe-clean, "Helvetica Neue", Helvetica, Arial, sans-serif;position: absolute;display: none;top: 0;left: 0;width: 100%;z-index: 10000;font-family: adobe-clean,"Helvetica Neue",Helvetica,Arial,sans-serif;line-height: 1.5;font-style: normal;font-weight: 300;color: #444;}.report-abuse-dialog.show {display: block;}.report-abuse-dialog a {color: #555555;cursor: pointer;}.report-abuse-dialog ul {margin: 0;padding: 0;border: 0;font-size: 100%;font: inherit;vertical-align: baseline;list-style: none;}.report-abuse-dialog .invalid-message, .report-abuse-dialog .required-message {color: red;margin-left: 5px;display: none;}.report-abuse-dialog .field.invalid .invalid-message {display: inline;}.report-abuse-dialog .field.required .required-message {display: inline;}.report-abuse-dialog .group:after {content: ".";display: block;height: 0;clear: both;visibility: hidden;}.report-abuse-dialog p, .report-abuse-dialog ul, .report-abuse-dialog label {font-size: 14px;font-size: .875rem;line-height: 18px;font-weight: 400;color: #444;}.report-abuse-dialog li:last-of-type {margin-bottom: none;}.report-abuse-dialog .report-abuse-dialog-scrim {position: fixed;top: 0;left: 0;width: 100%;height: 100%;background: #000;opacity: .60;filter: alpha(opacity=60);}.report-abuse-dialog .report-abuse-dialog-content {width: 50%;min-width: 280px;max-width: 500px;background: #fff;position: relative;margin: 65px auto 0;padding: 10px;}.report-abuse-dialog .report-abuse-dialog-content-inner {padding-top: 42px;background: #fff;}.report-abuse-dialog .header {position: absolute;top: 0;left: 10px;right: 10px;background: white;word-wrap: break-word;z-index: 10;padding: 16px 18px 0;}.report-abuse-dialog .article {position: relative;padding: 12px 18px 22px 18px;border-top: 1px solid rgba(255, 255, 255, 0.9);}.report-abuse-dialog .report-abuse-dialog-article-contents {-webkit-tap-highlight-color: transparent;}.report-abuse-dialog .header .dialog-title {font-family: adobe-clean, "Helvetica Neue", Helvetica, Arial, sans-serif;margin: 0;font-size: 1.5rem;font-weight: 400;line-height: 1.4;color: #000;word-wrap: break-word;}.report-abuse-dialog .report-abuse-dialog-content .btn-close {z-index: 11;position: absolute;right: 2px;top: 10px;background: transparent;border: 0;width: auto;opacity: .5;-ms-filter: "alpha(Opacity=50)";-webkit-transition: opacity .25s ease-in;-moz-transition: opacity .25s ease-in;-o-transition: opacity .25s ease-in;-ms-transition: opacity .25s ease-in;transition: opacity .25s ease-in;}.report-abuse-dialog .report-abuse-dialog-content .btn-close em {display: block;width: 30px;height: 30px;text-indent: -9999em;margin: 0 auto;}.report-abuse-dialog .report-abuse-dialog-content .btn-close:hover {opacity: .8;-ms-filter: "alpha(Opacity=80)";}.report-abuse-dialog .report-abuse-dialog-content .btn-close:active {box-shadow: none;}.report-abuse-dialog .report-abuse-dialog-content .btn-close:active {background: 0;border: 0;outline: 0;}.report-abuse-dialog .report-abuse-dialog-content .btn-close:hover {cursor: pointer;}.report-abuse-dialog .report-abuse-dialog_error {display: none;color: #333;white-space: normal;background: #fff38e;padding: 15px;margin-top: 10px;font-weight: 400;border: 1px solid #dbde7e;}/* REPORT ABUSE */.report-abuse-report-abuse-dialog .report-abuse-dialog .report-abuse-dialog-content {max-width: 450px;}.report-abuse-form button {width: 100%;}.report-abuse-form ul, .report-abuse-form p {margin-bottom: 10px;}.report-abuse-form ul.checkbox li {display: inline-block;width: 30%;}.report-abuse-form ul.radio li {vertical-align: top;display: inline-block;width: 49%;}.report-abuse-form ul.info li {width: 48%;float: left;}.report-abuse-form ul.info li:last-of-type {margin-left: 4%;}.report-abuse-form input[type=text], .report-abuse-form input[type=email], .report-abuse-form textarea {display: block;width: 100%;resize: none;padding: 0;font-size: 14px;font-size: .875rem;border: 1px solid #d8d8d8;background: #fff;outline: none;font-family: adobe-clean,"Helvetica Neue",Helvetica,Arial,sans-serif;}.report-abuse-form input[type=text], .report-abuse-form input[type=email] {height: 30px;text-indent: 5px;margin-bottom: 10px;}.report-abuse-form textarea {width: 98%;padding: 1%;height: 55px;}.report-abuse-form label {margin: 5px 0;line-height: 1.5;}.report-abuse-form label em {font-weight: bold;}.report-abuse-form label b {color: red;font-weight: bold;display: block;margin: -1px 0 2px 0;}.report-abuse-form input[type=checkbox], .report-abuse-form input[type=radio] {float: left;margin-right: 4px;width: 20px;height: 20px;}.report-abuse-form input[type=radio] {margin-top: 2px;}@-moz-document url-prefix() {.report-abuse-form input[type=checkbox], .report-abuse-form input[type=radio] {position: relative;top: -2px;margin-right: 7px;}}.report-abuse-form button.btn-submit {margin-bottom: 5px;}.banner {font-family:adobe-clean,"Helvetica Neue",Helvetica,Arial,sans-serif;}@media only screen and (max-width: 600px) {.report-abuse-form ul.checkbox li {width: 100%;}.report-abuse-form ul.radio li {width: 100%;}.report-abuse-form ul.info li {width: 100%;float: none;}.report-abuse-form ul.info li:last-of-type {margin-left: 0;}}.report-abuse-dialog button:focus {outline: 0;}.report-abuse-dialog .sprite30x30 {background-image: url("images/close-report-abuse.png");background-size: 30px;}.report-abuse-dialog .buttons {margin-top: 10px;display: -webkit-box;display: -moz-box;display: box;display: -webkit-flex;display: -moz-flex;display: -ms-flexbox;display: flex;-webkit-box-pack: justify;-moz-box-pack: justify;box-pack: justify;-webkit-justify-content: space-between;-moz-justify-content: space-between;-ms-justify-content: space-between;-o-justify-content: space-between;justify-content: space-between;-ms-flex-pack: justify;}.report-abuse-dialog .buttons > * {display: block;max-width: 47%;}.report-abuse-dialog .button {font-family: inherit;cursor: pointer;-webkit-appearance: none;outline: none;width: 100%;border-radius: 5px;border: 2px solid #666;background-color: #666;text-decoration: none;color: white;padding: 0.7em 0.9em;font-size: 0.9rem;font-size: 300;}.report-abuse-dialog .button.cancel {background-color: white;color: #666666;}.report-abuse-dial .button.full {width: 100%;}.report-abuse-dialog .notice {margin-bottom: 0;}@media only screen and (max-width: 480px), screen and (min-device-width: 320px) and (max-device-width: 568px) and (orientation: landscape) {.report-abuse-dialog {position: absolute;top: 0;right: 0;bottom: 0;left: 0;}.report-abuse-dialog .report-abuse-dialog-content {position: absolute;top: 2rem;left: 2rem;bottom: 2rem;right: 2rem;overflow: hidden;max-height: 710px;width: auto;}.report-abuse-dialog .report-abuse-dialog-content-inner {height: 100%;overflow-y: auto;-webkit-overflow-scrolling: touch;}.report-abuse-dialog .report-abuse-dialog-content {margin-top: 0;}.report-abuse-dialog p, .report-abuse-dialog ul, .report-abuse-dialog label {font-size: 1.5rem;}.report-abuse-dialog .header h1 {font-size: 2.5rem;}.report-abuse-form input[type=text], .report-abuse-form input[type=email], .report-abuse-form textarea {font-size: 1.5rem;}.report-abuse-dialog .buttons {-webkit-box-orient: vertical;-moz-box-orient: vertical;box-orient: vertical;-webkit-box-direction: reverse;-moz-box-direction: reverse;box-direction: reverse;-webkit-flex-direction: column-reverse;-moz-flex-direction: column-reverse;flex-direction: column-reverse;-ms-flex-direction: column-reverse;}.report-abuse-dialog .buttons > * {font-size: 1.5rem;margin-bottom: 1rem;width: 100%;max-width: 100%;}}* {-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;}',"report_abuse" : '<div class="banner success js-report-success"><p class="message">Your report has been submitted.</p></div><div class="banner error js-report-error"><p class="message">There was a problem submitting your report. Please contact <a href="http://helpx.adobe.com/support.html">Adobe Support</a>.</p></div><div class="report-abuse-dialog js-report-abuse-dialog"><div class="report-abuse-dialog-scrim"> </div><div class="report-abuse-dialog-content"><div class="spinner-modal js-spinner-modal"><div class="spinner-modal-spinner"></div></div><div class="header"><p class="dialog-title">Report Abuse</p><button title="Close" class="btn-close btn-reportabuse-close js-report-abuse-close"><em class="sprite30x30">Close</em></button></div><div class="report-abuse-dialog-content-inner"><div class="article"><div class="report-abuse-dialog-article-contents"><form class="report-abuse-form js-report-abuse-form"><p>If you feel that the content of this page violates the Adobe <a href="http://www.adobe.com/go/tou" target="_blank">Terms of Use</a>, you may report this content by filling out this quick form.</p><ul class="group info"><li class="field" data-required="true" data-type="email"><label id="email-label" for="email"><strong>Your Email</strong> <strong class="required-message">Required</strong> <strong class="invalid-message">Invalid</strong><b></b></label><input id="email" name="email" type="email"></li><li class="field" data-required="true"><label id="name-label" for="name"><strong>Your Name</strong> <strong class="required-message">Required</strong><b></b></label><input id="name" name="name" type="text"></li></ul><p></p><div class="field" data-required="true"><label id="radio-label"><strong>Why are you reporting this content?</strong> <strong class="required-message">Required</strong><b></b></label><ul class="radio"><li><input type="radio" id="def" name="type" value="defamation"><label for="def">Defamation</label></li><li><input type="radio" id="tra" name="type" value="trademark"><label for="tra">Trademark Infringement</label></li><li><input type="radio" id="off" name="type" value="vulgar"><label for="off">Offensive Content</label></li><li><input type="radio" id="rac" name="type" value="hate"><label for="rac">Racist or Hate Content</label></li><li><input type="radio" id="exp" name="type" value="pornography"><label for="exp">Sexually Explicit Content</label></li><li><input type="radio" id="oth" name="type" value="other"><label for="oth">Other</label></li></ul></div><ul><li class="field" data-required="true"><label id="desc-label"><strong>Please provide a description of your concern.</strong> <strong class="required-message">Required</strong><b></b></label><textarea maxlength="1024" name="description" rows="4" id="description"></textarea></li></ul><p class="notice">To report a copyright violation, please follow the DMCA section in the <a href="http://www.adobe.com/go/tou" target="_blank">Terms of Use</a>.</p><div class="buttons"><button type="button" class="button cancel js-report-abuse-cancel">Cancel </button><input type="submit" class="button" value="Report Abuse" ></div></form></div><!--dialog-article-contents--></div><!--article--></div><!--dialog-content-inner--></div><!--dialog-content--></div><!--report-abuse-dialog-->',"spark_bumper_ios" : '<div class="section spark-bumper-section visible" data-section-behavior="spark-bumper" data-layer-name="under" data-layer="-1"><div class="section-view"><!--BUMPER-CONTENT-START--><div class="bumper-content"><div class="bumper-content-container"><span class="made-with">Made with</span><a class="spark-page-logo logo" href="https://c00.adobe.com/v3/2c18a4dd7ed9e6bff783299fe0861806c9f14220edc8b0d08d613ccb7b9cae6c/start?a_dl=572d19a1547a4e7049fa5ffa{{# pageId }}&ctxmy.viralityId={{ pageId }}{{/ pageId }}" data-analytics-get-slate=""></a><span class="adobe-spark-page">Adobe Spark Page</span><span class="tag-line">Turn words and images into beautiful web stories&mdash;in minutes <a class="learn-more inline" href="https://spark.adobe.com/about/page?r=reader_page_learnmore">Learn more.</a></span><a class="get-spark-page button" href="https://c00.adobe.com/v3/2c18a4dd7ed9e6bff783299fe0861806c9f14220edc8b0d08d613ccb7b9cae6c/start?a_dl=572d19a1547a4e7049fa5ffa{{# pageId }}&ctxmy.viralityId={{ pageId }}{{/ pageId }}" data-analytics-get-slate="">Get Spark Page</a><a class="learn-more block" href="https://spark.adobe.com/about/page?r=reader_page_learnmore">Learn more.</a></div></div><!--BUMPER-CONTENT-END--><!--FOOTER-START--><div class="footer"><span class="copyright">© {{ currentYear }} Adobe. All rights reserved.</span><span class="tos"><a target="_blank" href="http://www.adobe.com/legal/terms.html" rel="nofollow">Terms of Service</a></span><span class="privacy"><a target="_blank" href="http://www.adobe.com/go/privacy" rel="nofollow">Privacy Policy</a></span><span class="report-abuse"><a class="js-report-abuse" href="#" target="_blank" rel="nofollow">Report Abuse</a></span><span class="adobe-logo"></span></div><!--FOOTER-END--></div></div>',"spark_bumper_mobile" : '<div class="section spark-bumper-section visible" data-section-behavior="spark-bumper" data-layer-name="under" data-layer="-1"><div class="section-view"><!--BUMPER-CONTENT-START--><div class="bumper-content"><div class="bumper-content-container"><span class="made-with">Made with</span><a class="spark-page-logo logo" href="https://spark.adobe.com/about?r=reader_page_logo" data-analytics-get-slate=""></a><span class="adobe-spark-page">Adobe Spark Page</span><span class="tag-line">Turn words and images into beautiful web stories&mdash;in minutes <a class="learn-more inline" href="https://spark.adobe.com/about/page?r=reader_page_learnmore">Learn more.</a></span><a class="get-spark-page button" href="https://spark.adobe.com/login?r=reader_page_bumper_createyourown" data-analytics-get-slate="">Get Spark Page</a><a class="learn-more block" href="https://spark.adobe.com/about/page?r=reader_page_learnmore">Learn more.</a></div></div><!--BUMPER-CONTENT-END--><!--FOOTER-START--><div class="footer"><span class="copyright">© {{ currentYear }} Adobe. All rights reserved.</span><span class="tos"><a target="_blank" href="http://www.adobe.com/legal/terms.html" rel="nofollow">Terms of Service</a></span><span class="privacy"><a target="_blank" href="http://www.adobe.com/go/privacy" rel="nofollow">Privacy Policy</a></span><span class="report-abuse"><a class="js-report-abuse" href="#" target="_blank" rel="nofollow">Report Abuse</a></span><span class="adobe-logo"></span></div><!--FOOTER-END--></div></div>',"spark_bumper.css" : '.sections-article-layout {/* bumper-section */ }.sections-article-layout .spark-bumper-section {max-height: 100%;bottom: auto;background-color: #35414d;-webkit-font-smoothing: antialiased;/* section-view */ }.sections-article-layout .spark-bumper-section .section-view {position: relative; }/* sections-article-layout */.spark-bumper-section {font-family: adobe-clean, sans-serif;font-size: 12px;font-weight: 300;line-height: 1;color: #82939d;/* bumper-content *//* footer */ }.spark-bumper-section .bumper-content {padding: 62px 0;text-align: center;/* button */ }.spark-bumper-section .bumper-content .made-with {display: block; }.spark-bumper-section .bumper-content .adobe-spark-page {display: inline-block;/* Needed for transforms */font-size: 28px;font-weight: 800;color: #e6eaed;vertical-align: middle; }.spark-bumper-section .bumper-content .logo {display: inline-block;margin-right: 10px;width: 42px;height: 42px;background-size: 100% 100%;background-repeat: no-repeat;vertical-align: middle; }.spark-bumper-section .bumper-content .spark-logo {background-image: url(https://s3.amazonaws.com/adobe-luca-prod-ue1-assets/experiments/chrome/images/spark_logo_v2.svg); }.spark-bumper-section .bumper-content .spark-page-logo {background-image: url(https://s3.amazonaws.com/adobe-luca-prod-ue1-assets/experiments/chrome/images/spark_page_logo_v2.svg); }.spark-bumper-section .bumper-content .tag-line {display: block;margin: 18px 0 31px 0;font-size: 16px;line-height: 1.5; }.spark-bumper-section .bumper-content .learn-more {color: #82939d;text-decoration: underline; }.spark-bumper-section .bumper-content .learn-more.block {display: none;margin-top: 28px;font-size: 16px; }.spark-bumper-section .bumper-content a.button {display: inline-block;cursor: pointer;-webkit-appearance: none;outline: none;margin-left: 0;border-radius: 1.5em;border: none;padding-left: 1.25em;padding-right: 1.25em;padding-top: 0.45em;padding-bottom: 0.6em;background-color: #dce0e3;color: #27475e;line-height: 1;font-family: inherit;font-size: 16px;font-weight: 600;white-space: pre;text-decoration: none;-webkit-transition: background-color 0.2s, color 0.2s;-moz-transition: background-color 0.2s, color 0.2s;transition: background-color 0.2s, color 0.2s; }.spark-bumper-section .bumper-content a.button:hover {background-color: #fff;color: #20282f; }.spark-bumper-section .footer {padding: 1.5rem 0.5rem;max-width: none;margin: 0 5%;font-size: 12px;line-height: 1.5;color: #82939d;border-top: 1px solid #6e7a86;display: -webkit-box;display: -moz-box;display: box;display: -webkit-flex;display: -moz-flex;display: -ms-flexbox;display: flex;-webkit-box-pack: justify;-moz-box-pack: justify;box-pack: justify;-webkit-justify-content: space-between;-moz-justify-content: space-between;-ms-justify-content: space-between;-o-justify-content: space-between;justify-content: space-between;-ms-flex-pack: justify;-webkit-box-align: center;-moz-box-align: center;box-align: center;-webkit-align-items: center;-moz-align-items: center;-ms-align-items: center;-o-align-items: center;align-items: center;-ms-flex-align: center;/* adobe-logo */ }.spark-bumper-section .footer > * {color: #82939d;font-weight: 300;padding: 0 0.5rem 0 0; }.spark-bumper-section .footer a {color: #82939d;text-decoration: none;font-weight: inherit; }.spark-bumper-section .footer > *:last-child {padding-right: 0; }.spark-bumper-section .footer .privacy {-webkit-box-flex: initial;-moz-box-flex: initial;box-flex: initial;-webkit-flex: initial;-moz-flex: initial;-ms-flex: initial;flex: initial; }.spark-bumper-section .footer .report-abuse {-webkit-box-flex: 1;-moz-box-flex: 1;box-flex: 1;-webkit-flex: 1;-moz-flex: 1;-ms-flex: 1;flex: 1; }.spark-bumper-section .footer .adobe-logo {position: relative; }.spark-bumper-section .footer .adobe-logo:before {content: \'\';display: inline-block;width: 70px;height: 16px;vertical-align: middle;background-size: contain;background-image: url(https://s3.amazonaws.com/adobe-luca-prod-ue1-assets/experiments/base/images/adobe-logo-gray.png);background-repeat: no-repeat;background-position: center; }/* spark-bumper-section*//* Switch to a 2 line footer format for narrow widths */@media only screen and (max-width: 680px) {/* spark-bumper-content */.spark-bumper-section {/* footer */ }.spark-bumper-section .footer {display: block;padding-top: 17px;padding-bottom: 30px; }.spark-bumper-section .footer .copyright {display: block;margin-bottom: 8px; }.spark-bumper-section .footer > * {padding-right: 16px; }.spark-bumper-section .footer .adobe-logo {float: right; }.spark-bumper-section .footer a {text-decoration: underline; } }/* Switch to vertically stacked bumper content for the phone form factor. */@media only screen and (max-width: 480px) {/* spark-bumper-content */.spark-bumper-section {/* bumper-content */ }.spark-bumper-section .bumper-content {padding-bottom: 42px; }.spark-bumper-section .bumper-content .logo {display: block;margin: 20px auto 13px auto;width: 54px;height: 54px; }.spark-bumper-section .bumper-content .learn-more.inline {display: none; }.spark-bumper-section .bumper-content .learn-more.block {display: block;margin-top: 24px; }.spark-bumper-section .bumper-content .tag-line {margin-top: 17px;margin-bottom: 47px;margin-right: auto;margin-left: auto;max-width: 14em; } }/* media max-width:480px *//* For Phones with extremely small widths, we need to reduce the * logo and font-sizes so that things fit a bit better within the available * viewport. */@media only screen and (max-width: 320px), only screen and (max-device-width: 320px) and (orientation: landscape) {.spark-bumper-section {/* bumper-content *//* footer */ }.spark-bumper-section .bumper-content {padding: 24px 0; }.spark-bumper-section .bumper-content .logo {display: inline-block;margin: 0 10px 0 0;width: 40px;height: 40px; }.spark-bumper-section .bumper-content .adobe-spark-page {font-size: 24px; }.spark-bumper-section .bumper-content .tag-line {font-size: 14px;margin-bottom: 17px; }.spark-bumper-section .bumper-content a.button {font-size: 14px; }.spark-bumper-section .bumper-content .learn-more.block {margin-top: 17px;font-size: 14px; }.spark-bumper-section .footer {padding-top: 4px;padding-bottom: 4px; }.spark-bumper-section .footer .copyright {display: block;margin-bottom: 4px; } }/* For Phones with extremely small widths, we stack the contents of the footer * so we end up with a footer of 3 centered lines. */@media only screen and (max-width: 320px) {/* spark-bumper-section */.spark-bumper-section {/* footer */ }.spark-bumper-section .footer {text-align: center;/* adobe-logo */ }.spark-bumper-section .footer .adobe-logo {float: none;display: block;margin: 8px; }.spark-bumper-section .footer .adobe-logo:before {height: 12px; } }/* For phones with extremely small widths, we need to hide the tag-line when in * landscape mode so that we can fit the main content and footer within the viewport. * Add to this the problem where on iPhone 4/5 faux scrolling prevents the browser from * hiding the URL and navigation bars, further reducing the size of the viewport. */@media only screen and (max-device-width: 320px) and (orientation: landscape) {.spark-bumper-section .bumper-content {/* We hide the tag-line by giving it a zero-width so that it still has a position * in the flow so the section-behavior can still animate the button after it which * calculates its timing based on the tag-line position. */ }.spark-bumper-section .bumper-content .tag-line {overflow: hidden;height: 0;margin-bottom: 0; }.spark-bumper-section .bumper-content .learn-more.inline {display: none; }.spark-bumper-section .bumper-content .learn-more.block {display: block; }.spark-bumper-section .footer {/* Our faux-scrolling prevents the iphone 4/5 from hiding it\'s browser chrome * so we need to push the footer up above the navigation bar with a margin so * that it can be seen. */margin-bottom: 50px;/* adobe-logo */ }.spark-bumper-section .footer .adobe-logo:before {height: 12px; } }.credits-in-bumper .sections-article-layout .section.credits-section {background-color: #35414d;color: #82939d;}',"spark_bumper" : '<div class="section spark-bumper-section visible" data-section-behavior="spark-bumper" data-layer-name="under" data-layer="-1"><div class="section-view"><!--BUMPER-CONTENT-START--><div class="bumper-content"><div class="bumper-content-container"><span class="made-with">Made with</span><a class="spark-logo logo" href="https://spark.adobe.com/about?r=reader_page_logo" data-analytics-get-slate=""></a><span class="adobe-spark-page">Adobe Spark Page</span><span class="tag-line">Give your logo a refresh with Spark. <a class="learn-more inline" href="https://spark.adobe.com/make/logo-maker?r=reader_page_learnmore">Learn more.</a></span><a class="create-your-own button" href="https://spark.adobe.com/login?r=reader_page_bumper_createyourown" data-analytics-get-slate="">Create your own</a><a class="learn-more block" href="https://spark.adobe.com/make/logo-maker?r=reader_page_learnmore">Learn more.</a></div></div><!--BUMPER-CONTENT-END--><!--FOOTER-START--><div class="footer"><span class="copyright">© {{ currentYear }} Adobe. All rights reserved.</span><span class="tos"><a target="_blank" href="http://www.adobe.com/legal/terms.html" rel="nofollow">Terms of Service</a></span><span class="privacy"><a target="_blank" href="http://www.adobe.com/go/privacy" rel="nofollow">Privacy Policy</a></span><span class="report-abuse"><a class="js-report-abuse" href="#" target="_blank" rel="nofollow">Report Abuse</a></span><span class="adobe-logo"></span></div><!--FOOTER-END--></div></div>',"un_branded_bumper.css" : '.sections-article-layout .un-branded-bumper-section {max-height: 100%;bottom: auto;background-color: #35414d;color: #82939d;font-family: adobe-clean, sans-serif;font-size: 12px;font-weight: 300;line-height: 1;-webkit-font-smoothing: antialiased;}.sections-article-layout .un-branded-bumper-section .section-view {position: relative;}.un-branded-bumper-section .footer {padding: 24px 8px;max-width: none;margin: 0 5%;color: #82939d;font-size: 12px;line-height: 1.5;text-align: center;}.un-branded-bumper-section .footer a {display: inline-block;white-space: nowrap;padding: 0 8px 0 0;color: #82939d;text-decoration: none;font-weight: 300;}.credits-in-bumper .sections-article-layout .section.credits-section {background-color: #35414d;color: #82939d;}@media ( max-width: 480px ) {.un-branded-bumper-section .footer {padding: 13.5px 4.5px;}.un-branded-bumper-section .footer a {padding: 0 4.5px 0 0;}}',"un_branded_bumper" : '<div class="section bumper-section un-branded-bumper-section visible" data-layer-name="under" data-layer="-1"><div class="section-view"><!--FOOTER-START--><div class="footer"><a class="tos" target="_blank" href="http://www.adobe.com/legal/terms.html" rel="nofollow">Terms of Service</a><a class="privacy" target="_blank" href="http://www.adobe.com/go/privacy" rel="nofollow">Privacy Policy</a><a class="js-report-abuse" href="#" target="_blank" rel="nofollow">Report Abuse</a></div><!--FOOTER-END--></div></div>',"spark_header_ios" : '<div class="section spark-header-section" data-section-behavior="spark-header" data-layer-name="over"><div class="section-view"><div class="spark-header"><div class="branding"><a class="adobe-spark" href="https://spark.adobe.com/about?r=reader_page_logo">Adobe Spark</a></div><div class="actions"><a class="create-your-own button" href="https://c00.adobe.com/v3/2c18a4dd7ed9e6bff783299fe0861806c9f14220edc8b0d08d613ccb7b9cae6c/start?a_dl=572d19fd547a4e7049fa5ffc{{# pageId }}&ctxmy.viralityId={{ pageId }}{{/ pageId }}" data-analytics-get-slate="">Create your own</a></div></div></div></div>',"spark_header_mobile" : '<div class="section spark-header-section" data-section-behavior="spark-header" data-layer-name="over"><div class="section-view"><div class="spark-header"><div class="branding"><a class="adobe-spark" href="https://spark.adobe.com/about?r=reader_page_logo">Adobe Spark</a></div><div class="actions"><a class="create-your-own button" href="https://spark.adobe.com/login?r=reader_page_topbar_createyourown" data-analytics-get-slate="">Create your own</a></div></div></div></div>',"spark_header.css" : '.spark-header {font-family: adobe-clean, sans-serif;font-weight: 400;-webkit-font-smoothing: antialiased;}.spark-header .branding {position: absolute;top: 0;bottom: 0;left: 0;}.spark-header .actions {position: absolute;top: 0;bottom: 0;right: 0;}.spark-header a.adobe-spark {display: block;background-image: url(https://s3.amazonaws.com/adobe-luca-prod-ue1-assets/experiments/chrome/images/spark_logo_v2.svg);background-position: left center;background-repeat: no-repeat;background-size: 32px 31px;vertical-align: middle;font-weight: 800;color: #82919b}.spark-header .branding a,.spark-header .actions a {text-decoration: none;pointer-events: auto;}.spark-header .actions a {color: #82919b;}/***************/.spark-header.floater {z-index: 10;position: absolute;top: 0;right: 0;left: 0;height: 55px;background-color: rgba(255,255,255,0.96);pointer-events: none;-webkit-transform:translate3d(0,-110%,0); -moz-transform:translate3d(0,-110%,0);-ms-transform:translate3d(0,-110%,0); -o-transform:translate3d(0,-110%,0);transform:translate3d(0,-110%,0);-webkit-transition: -webkit-transform 0.3s, background-color 0.5s; -moz-transition:-moz-transform 0.3s, background-color 0.5s;-ms-transition: -ms-transform 0.3s, background-color 0.5s; -o-transition:-o-transform 0.3s, background-color 0.5s;transition: transform 0.3s, background-color 0.5s;}.spark-header.floater.show {-webkit-transform:translate3d(0,0,0); -moz-transform:translate3d(0,0,0);-ms-transform:translate3d(0,0,0); -o-transform:translate3d(0,0,0);transform:translate3d(0,0,0);}.spark-header.floater.above-the-fold {background-color: rgba(255,255,255,0);}@-webkit-keyframes spark-header-fade-in {0% {opacity: 0;}100% {opacity: 1;}}@-moz-keyframes spark-header-fade-in {0% {opacity: 0;}100% {opacity: 1;}}@-o-keyframes spark-header-fade-in {0% {opacity: 0;}100% {opacity: 1;}}@-ms-keyframes spark-header-fade-in {0% {opacity: 0;}100% {opacity: 1;}}@keyframes spark-header-fade-in {0% {opacity: 0;}100% {opacity: 1;}}.spark-header.floater.above-the-fold:before {content: \'\';position: absolute;opacity: 1;left: 0;top: 0;right: 0;height: 90px;background: rgba(0,0,0,0.6);background: -moz-linear-gradient(top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 85%);background: -webkit-gradient(left top, left bottom, color-stop(0%, rgba(0,0,0,0.6)), color-stop(85%, rgba(0,0,0,0)));background: -webkit-linear-gradient(top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 85%);background: -o-linear-gradient(top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 85%);background: -ms-linear-gradient(top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 85%);background: linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 85%);-webkit-animation: 0.5s linear spark-header-fade-in; -moz-animation: 0.5s linear spark-header-fade-in; -o-animation: 0.5s linear spark-header-fade-in;-ms-animation: 0.5s linear spark-header-fade-in;animation: 0.5s linear spark-header-fade-in;}.spark-header.floater .branding,.article .spark-header .actions,.article .spark-header a.adobe-spark {line-height: 55px;}.spark-header.floater .branding {padding: 0 30px;}.spark-header.floater a.adobe-spark {padding-left: 40px;font-size: 20px;color: #370000;-webkit-transition: color 0.5s; -moz-transition: color 0.5s;-ms-transition: color 0.5s; -o-transition: color 0.5s;transition: color 0.5s;}.spark-header.floater.above-the-fold a.adobe-spark {color: #fff;}.spark-header.floater .actions {padding: 0 30px;}.spark-header.floater .actions .button {display: inline-block;line-height: 1;margin-bottom: 6px;border: 2px solid #1473E6;border-radius: 40px;padding: 8px 20px 9px 20px;background-color: #1473E6;color: rgba(255,255,255,1);font-size: 15px;font-weight: 700;vertical-align: middle;-webkit-transition: border-color 0.5s, background-color 0.5s, color 0.5s; -moz-transition: border-color 0.5s, background-color 0.5s, color 0.5s;-ms-transition: border-color 0.5s, background-color 0.5s, color 0.5s; -o-transition: border-color 0.5s, background-color 0.5s, color 0.5s;transition: border-color 0.5s, background-color 0.5s, color 0.5s;}.spark-header.floater.above-the-fold .actions .button {border: 2px solid rgba(255,255,255,0.75);background-color: rgba(252,206,0,0);color: rgba(255,255,255,0.75);}.spark-header.floater.above-the-fold .actions .button:hover {border-color: rgba(255,255,255,1);color: rgba(255,255,255,1);}.spark-header-create-links {display: none;position: absolute;z-index: 20;top: 0;bottom: 0;left: 0;right: 0;background-color: rgba(0,0,0,0);}.spark-header-create-links.open {display: block;}.spark-header-create-links-content {position: absolute;background-color: rgba(36,44,51,1);top: 0;right: 29px;width: 150px;padding: 5px;border-radius: 0px 0px 14px 14px;box-shadow: 0px 0px 3px rgba(255,255,255,0.75);}.spark-header-create-links-content ul {list-style-type: none;padding-left: 15px;padding-right: 5px;margin: 6px 4px;}.spark-header-create-links-content h5 {font-family: adobe-clean, sans-serif;font-size: 15px;font-weight: 700;color: #FFFFFF;text-align: center;line-height: 1.5;padding: 10px 7px 5px 7px;}.spark-header-create-links-content a {display: block;width: 100%;text-decoration: none;font-family: adobe-clean, sans-serif;font-size: 15px;font-weight: 400;line-height: 1.5;color: #82919b;cursor: pointer;}.spark-header-create-links-content a:hover {color: #FFFFFF;}/***************/.sections-article-layout .spark-header-section {height: 40px;}.spark-header-section .spark-header {position: absolute;top: 0;right: 0;bottom: 0;left: 0;height: auto;background-color: white;}.spark-header-section .spark-header .branding,.spark-header-section .spark-header .actions,.spark-header-section .spark-header a.adobe-spark {line-height: 40px;}.spark-header-section .spark-header .branding {padding: 0 12px;}.spark-header-section .spark-header a.adobe-spark {padding-left: 32px;font-size: 14px;background-size: 25px 24px;}.spark-header-section .spark-header .actions {padding: 0 12px;font-size: 14px;}',"spark_header" : '<div class="spark-header floater show above-the-fold"><div class="branding"><a class="adobe-spark" href="https://spark.adobe.com/about?r=reader_page_logo">Adobe Spark</a></div><div class="actions"><a class="create-your-own button" href="https://spark.adobe.com/login?r=reader_page_topbar_createyourown" data-analytics-get-slate="">Create your own</a></div></div><div class="spark-header-create-links"><div class="spark-header-create-links-content"><h5>Create your own</h5><ul><li><a href="https://spark.adobe.com/templates/resumes/">Resumes</a><li><a href="https://spark.adobe.com/templates/invoices/">Invoices</a><li><a href="https://spark.adobe.com/templates/business-cards/">Business Cards</a><li><a href="https://spark.adobe.com/templates/banners/youtube-channel-art/">Youtube Banners</a><li><a href="https://spark.adobe.com/templates/brochures/">Brochures</a><li><a href="https://spark.adobe.com/templates/newsletters/">Newsletters</a><li><a href="https://spark.adobe.com/templates/invitations/">Invitations</a><li><a href="https://spark.adobe.com/templates/">See more</a></ul></div></div>',"bar.css" : '.topbar {position: fixed;top: -60px;left: 0;right: 0;height: 60px;background: rgba(0,0,0,0.4);-webkit-transition: top 0.3s, background 0.5s; -moz-transition: top 0.3s, background 0.5s;-ms-transition: top 0.3s, background 0.5s; -o-transition: top 0.3s, background 0.5s;transition: top 0.3s, background 0.5s;color: white;font-family: adobe-clean, sans-serif;z-index: 1;}.topbar:before {content: \'\';position: absolute;left: 0;top: 0;right: 0;height: 100px;background: none;-webkit-transition: background 0.5s; -moz-transition: background 0.5s;-ms-transition: background 0.5s; -o-transition: background 0.5s;transition: background 0.5s;}.topbar.show {top: 0;}.topbar.above-the-fold {background: none;}.topbar.above-the-fold:before {background: rgba(0,0,0,0.6);background: -moz-linear-gradient(top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 85%);background: -webkit-gradient(left top, left bottom, color-stop(0%, rgba(0,0,0,0.6)), color-stop(85%, rgba(0,0,0,0)));background: -webkit-linear-gradient(top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 85%);background: -o-linear-gradient(top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 85%);background: -ms-linear-gradient(top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 85%);background: linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 85%);}.topbar .logo {position: absolute;left: 15px;height: 100%;padding-left: 50px;background-image: url(https://s3.amazonaws.com/adobe-luca-prod-ue1-assets/experiments/base/logo.png);background-repeat: no-repeat;background-position: left;background-size: 41px 40px;}.topbar .logo:before {content: "";display: inline-block;height: 100%;width: 1px;vertical-align: middle;}.topbar .logo span {display: inline-block;vertical-align: middle;padding-top: 0px;font-size: 1.25rem;font-weight: 300;}.topbar .action {position: absolute;right: 32px;top: 0;height: 100%;text-align: right;width: 50%;}.topbar .action:before {content: \'\';display: inline-block;vertical-align: middle;height: 100%;width: 0;}.topbar .action a {display: inline-block;vertical-align: middle;color: rgba(255,255,255,0.75);border: 1px solid rgba(255,255,255,0.75);text-decoration: none;font-weight: 300;font-size: 0.9rem;padding: 8px 20px 10px 20px;border-radius: 5px;margin-left: 10px;-webkit-transition: color 0.3s, border-color 0.3s; -moz-transition: color 0.3s, border-color 0.3s;-ms-transition: color 0.3s, border-color 0.3s; -o-transition: color 0.3s, border-color 0.3s;transition: color 0.3s, border-color 0.3s;}.topbar .action a:hover {color: rgba(255,255,255,1);border-color: rgba(255,255,255,1);}/* iPhone */@media only screen and (max-width: 480px),screen and (min-device-width : 320px) and (max-device-width : 568px) and (orientation : landscape) {.topbar {top: -40px;height: 40px;}.topbar .logo {padding-left: 37px;background-size: 30px 30px;}.topbar .logo span {font-size: 2rem;}.topbar .action a {padding: 4px 10px 5px 10px;font-size: 1.2rem;}}',"bar" : '<div class="topbar show above-the-fold"><div class="logo"><span>Adobe Slate</span></div><div class="action"><a class="create-your-own" href="https://slate.adobe.com{{# path }}{{ path }}{{/ path }}/?r={{ trackingId }}{{# postPath }}{{ postPath }}{{/ postPath }}" target="_blank">{{ buttonText }}</a></div></div>',"brand_bumper" : '<div class="section bumper-section branded-bumper-section{{# section_class }} {{{ section_class }}}{{/ section_class }}"{{# layerName }} data-layer-name="{{ layerName }}"{{/ layerName }}{{# layer }} data-layer="{{ layer }}"{{/ layer }}><div class="section-view"><div class="brand-content">{{# brandUrl }}{{# hasBrandLogo }}<a class="logo" rel="nofollow noreferrer" href="{{ brandUrl }}"></a>{{/ hasBrandLogo }}{{^ hasBrandLogo }}<a class="no-logo" rel="nofollow noreferrer" href="{{ brandUrl }}">{{ brandName }}</a>{{/ hasBrandLogo }}{{/ brandUrl }}{{^ brandUrl }}{{# hasBrandLogo }}<span class="logo"></span>{{/ hasBrandLogo }}{{^ hasBrandLogo }}<span class="no-logo">{{ brandName }}</span>{{/ hasBrandLogo }}{{/ brandUrl }}{{# hasSocialUrls }}<div class="social-links">{{# facebookUrl }}<a target="_blank" rel="nofollow noreferrer" style=\'background-image:url(data:image/svg+xml;base64,{{{ facebookIcon }}})\' class="social-link facebook" href="{{ facebookUrl }}"></a>{{/ facebookUrl }}{{# twitterUrl }}<a target="_blank" rel="nofollow noreferrer" style=\'background-image:url(data:image/svg+xml;base64,{{{ twitterIcon }}})\' class="social-link facebook" href="{{ twitterUrl }}"></a>{{/ twitterUrl }}{{# instagramUrl }}<a target="_blank" rel="nofollow noreferrer" style=\'background-image:url(data:image/svg+xml;base64,{{{ instagramIcon }}})\' class="social-link instagram" href="{{ instagramUrl }}"></a>{{/ instagramUrl }}</div>{{/ hasSocialUrls }}{{# brandCTAEnabled }}{{# brandCTA }}{{# brandCTAUrl }}<div class="actions"><a class="call-to-action button{{# brandCTAButtonStyle }} {{ brandCTAButtonStyle }}{{/ brandCTAButtonStyle }}" rel="nofollow noreferrer" href="{{ brandCTAUrl }}">{{ brandCTA }}</a></div>{{/ brandCTAUrl }}{{/ brandCTA }}{{/ brandCTAEnabled }}</div><div class="footer"> <a class="tos" target="_blank" href="http://www.adobe.com/legal/terms.html" rel="nofollow">Terms &amp; Conditions</a> <a class="privacy" target="_blank" href="http://www.adobe.com/go/privacy" rel="nofollow">Privacy Policy</a> <a class="js-report-abuse" href="#" target="_blank" rel="nofollow">Report Abuse</a></div></div></div>',"brand_embedded_style.css" : '{{^ brand_disable_style }}/* BRAND KIT SPLASH */.splash .loading-label {font-family: adobe-clean, sans-serif;font-weight: bold;font-size: 20px;letter-spacing: .25em;text-transform: uppercase;color: {{ splashLoadingLabelColor }};text-shadow: 0 0 2px rgba(144,144,144,0.3); /* #909090 30% */}.splash .title {margin-bottom: 1em;font-family: adobe-clean, sans-serif;font-size: 42px;text-transform: uppercase;color: {{ splashTextColor }};}.splash .wp-progress-bar {border-color: rgba(255,255,255,.3);background-color: rgba(255,255,255,.25);box-shadow: 1px 1px 4px rgba(0,0,0,.25);}.splash .wp-progress-bar-view {background-color: {{ splashProgressBarColor }};}.splash .logo {background-image: url({{{ splashLogo }}});background-repeat: no-repeat;background-position: bottom center;width: 200px;height: 80px;top: -150px;}/* BRAND KIT HEADER */.brand-header {font-family: adobe-clean, sans-serif;}.brand-header .logo {background-image: url({{{ headerLogo }}});}.brand-header .no-logo {display: inline-block;vertical-align: middle;font-size: 1.8rem;line-height: 1em;font-family: adobe-clean, sans-serif;color: {{ ctaBkgColor }};}.brand-header .actions .button {background-color: {{ ctaBkgColor }};color: {{ ctaTextColor }};font-family: proxima-nova, adobe-clean, sans-serif;font-size: 14px;font-weight: 400;}.brand-header .actions .button.rect {border-radius: 0;}.brand-header .actions .button.rounded {border-radius: 5px;}.brand-header .actions .button.pill {border-radius: 21px;}.brand-header .actions .button.brand-cta-rounded {border-radius: 4px;}.brand-header .actions .button.brand-cta-pill {border-radius: 1000px;}{{# ctaBkgHoverColor }}.brand-header .actions .button:hover {background-color: {{ ctaBkgHoverColor }};}{{/ ctaBkgHoverColor }}{{# ctaBkgActiveColor }}.brand-header .actions .button:active {background-color: {{ ctaBkgActiveColor }};}{{/ ctaBkgActiveColor }}.brand-header.floater {background-color: {{ headerBkgFloaterColor }};border-bottom: solid 1px rgba(220,224,227,0.5);}.brand-header.floater.above-the-fold {border-bottom: solid 1px rgba(220,224,227,0);}.brand-header.floater.above-the-fold:before {background: rgba(0,0,0,.6);background: -moz-linear-gradient(top,rgba(0,0,0,.6) 0,rgba(0,0,0,0) 85%);background: -webkit-gradient(left top,left bottom,color-stop(0,rgba(0,0,0,.6)),color-stop(85%,rgba(0,0,0,0)));background: -webkit-linear-gradient(top,rgba(0,0,0,.6) 0,rgba(0,0,0,0) 85%);background: -o-linear-gradient(top,rgba(0,0,0,.6) 0,rgba(0,0,0,0) 85%);background: -ms-linear-gradient(top,rgba(0,0,0,.6) 0,rgba(0,0,0,0) 85%);background: linear-gradient(to bottom,rgba(0,0,0,.6) 0,rgba(0,0,0,0) 85%);}.brand-header-section {background-color: {{ headerBkgSectionColor }};}.brand-header-section .actions .button {font-size: 12px;}/* BRAND KIT BUMPER */.sections-article-layout .branded-bumper-section {background-color: {{ bumperBkgColor }};}.sections-article-layout .branded-bumper-section .brand-content .logo {background-image: url({{{ bumperLogo }}});width: 200px;height: 80px;}.sections-article-layout .branded-bumper-section .brand-content .no-logo {display: inline-block;font-size: 1.8rem;line-height: 1em;font-family: adobe-clean, sans-serif;color: {{ ctaTextColor }};}.sections-article-layout .branded-bumper-section .brand-content .logo,.sections-article-layout .branded-bumper-section .brand-content .no-logo {margin-bottom: 45px;}.sections-article-layout .branded-bumper-section .footer {padding-top: 15px;padding-bottom: 15px;}.sections-article-layout .branded-bumper-section .footer a {color: {{ bumperTOSColor }};font-family: adobe-clean, sans-serif;font-size: 12px;font-weight: 300;}.branded-bumper-section .social-links {margin-bottom: 30px;}.branded-bumper-section .social-link {display: inline-block;margin: 0 5px;width: 32px;height: 32px;font-family: adobe-clean, sans-serif;font-weight: bold;line-height: 32px;background-repeat: no-repeat;background-position: center;background-size: contain;}.branded-bumper-section .actions {}.sections-article-layout .branded-bumper-section .brand-content {padding-top: 60px;padding-bottom: 53px;}.sections-article-layout .branded-bumper-section .brand-content .button {border-color: {{ bumperTextColor }};color: {{ bumperTextColor }};font-family: proxima-nova, adobe-clean, sans-serif;border-width: 1px;border-style: solid;text-decoration: none;display: inline-block;padding: 0 20px;font-size: 15px;line-height: 36px;font-weight: 400;}.sections-article-layout .branded-bumper-section .brand-content .button.rect {border-radius: 0;}.sections-article-layout .branded-bumper-section .brand-content .button.rounded {border-radius: 5px;}.sections-article-layout .branded-bumper-section .brand-content .button.pill {border-radius: 21px;}{{/ brand_disable_style }}',"brand_header" : '<div class="section brand-header-section" data-section-behavior="brand-header" data-layer-name="over"><div class="section-view"><div class="brand-header"><div class="branding">{{# brandUrl }}{{# hasBrandLogo }}<a class="logo" rel="nofollow noreferrer" href="{{ brandUrl }}"></a>{{/ hasBrandLogo }}{{^ hasBrandLogo }}<a class="no-logo" rel="nofollow noreferrer" href="{{ brandUrl }}">{{ brandName }}</a>{{/ hasBrandLogo }}{{/ brandUrl }}{{^ brandUrl }}{{# hasBrandLogo }}<span class="logo"></span>{{/ hasBrandLogo }}{{^ hasBrandLogo }}<span class="no-logo">{{ brandName }}</span>{{/ hasBrandLogo }}{{/ brandUrl }}</div>{{# brandCTAEnabled }}<div class="actions">{{# brandCTA }}{{# brandCTAUrl }}<a class="call-to-action button{{# brandCTAButtonStyle }} {{ brandCTAButtonStyle }}{{/ brandCTAButtonStyle }}" rel="nofollow noreferrer" href="{{ brandCTAUrl }}">{{ brandCTA }}</a>{{/ brandCTAUrl }}{{/ brandCTA }}</div>{{/ brandCTAEnabled }}</div></div></div>',"brand_splash" : '<div id="luca-splash" class="splash">{{# splash }}{{# image }}<div class="background"{{# image.src }} style="background-image: url({{{ image.src }}});{{# image.align}} background-position: {{{ image.align }}};{{/ image.align }}"{{/ image.src }}></div>{{/ image }}{{/ splash }}<div class="content"><div class="logo"></div><div class="loading-label">Loading</div><div class="wp-progress-bar"><div class="wp-progress-bar-clip"><div class="wp-progress-bar-view"></div></div></div></div></div>',"icon_facebook.svg" : '<svg version="1.1" id="Icons" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 32 32" width="32" height="32" style="enable-background:new 0 0 32 32;" xml:space="preserve"><style type="text/css">.st0{fill:{{FILL_COLOR}};{{# FILL_OPACITY }}fill-opacity: {{ FILL_OPACITY }}{{/ FILL_OPACITY }}}</style><path class="st0" d="M16,0C7.2,0,0,7.2,0,16s7.2,16,16,16s16-7.2,16-16S24.8,0,16,0z M19.4,16h-2.2v8h-3.3v-8h-1.6v-2.8h1.6v-1.8 C13.7,9.6,15,8.1,16.7,8c0.2,0,0.3,0,0.5,0h2.5v2.7h-1.8c-0.4,0-0.7,0.3-0.7,0.7c0,0,0,0.1,0,0.1v1.7h2.5L19.4,16z"/></svg>',"icon_instagram.svg" : '<svg version="1.1" id="Icons" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 32 32" width="32" height="32" style="enable-background:new 0 0 32 32;" xml:space="preserve"><style type="text/css">.st0{fill:{{FILL_COLOR}};{{# FILL_OPACITY }}fill-opacity: {{ FILL_OPACITY }}{{/ FILL_OPACITY }}}</style><path class="st0" d="M16,19.2c1.8,0,3.2-1.4,3.2-3.2c0-1.8-1.4-3.2-3.2-3.2c-1.8,0-3.2,1.4-3.2,3.2C12.8,17.8,14.2,19.2,16,19.2z M16,0C7.2,0,0,7.2,0,16s7.2,16,16,16s16-7.2,16-16S24.8,0,16,0z M25.1,14.1v7.4c0,1.9-1.6,3.5-3.5,3.5l0,0H10.4 c-1.9,0-3.5-1.6-3.5-3.5l0,0V10.4c0-1.9,1.6-3.5,3.5-3.5h11.2c1.9,0,3.5,1.6,3.5,3.5l0,0V14.1z M21,16c0.1,2.8-2.1,5-4.9,5.1 s-5-2.1-5.1-4.9c0-0.7,0.1-1.4,0.4-2.1H8.7v7.4c0,1,0.8,1.7,1.7,1.7h11.2c1,0,1.7-0.8,1.7-1.7v-7.4h-2.7C20.9,14.7,21,15.4,21,16z M20,9.1h3v3h-3V9.1z"/></svg>',"icon_twitter.svg" : '<svg version="1.1" id="Icons" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 32 32" width="32" height="32" style="enable-background:new 0 0 32 32;" xml:space="preserve"><style type="text/css">.st0{fill:{{FILL_COLOR}};{{# FILL_OPACITY }}fill-opacity: {{ FILL_OPACITY }}{{/ FILL_OPACITY }}}</style><path class="st0" d="M16,0C7.2,0,0,7.2,0,16s7.2,16,16,16s16-7.2,16-16S24.8,0,16,0z M22.4,12.7c0,0.1,0,0.3,0,0.4 c0,5.2-4.2,9.3-9.4,9.3c-1.8,0-3.5-0.5-5-1.5c0.3,0,0.5,0,0.8,0c1.5,0,2.9-0.5,4.1-1.4c-1.4,0-2.6-0.9-3.1-2.3 c0.2,0,0.4,0.1,0.6,0.1c0.3,0,0.6,0,0.9-0.1c-1.5-0.3-2.6-1.7-2.6-3.2l0,0c0.5,0.3,1,0.4,1.5,0.4c-1.4-1-1.9-2.9-1-4.4 c1.7,2.1,4.1,3.3,6.8,3.4c-0.4-1.8,0.7-3.5,2.5-3.9c1.1-0.3,2.3,0.1,3.1,0.9c0.7-0.1,1.4-0.4,2.1-0.8c-0.2,0.8-0.8,1.4-1.4,1.8 c0.6-0.1,1.3-0.3,1.9-0.5C23.6,11.7,23,12.3,22.4,12.7z"/></svg>',"bumper" : '<!--BUMPER-SECTION-TOP-LEVEL-START--><div id="bumper-section" class="section bumper-section" data-section-behavior="bumper-grow-and-fade"{{# layer }} data-layer="{{{ layer }}}"{{/ layer }}{{# layerName }} data-layer-name="{{{ layerName }}}"{{/ layerName }}><div class="section-view"><!--BUMPER-CONTENT-START--><div class="bumper-content"><div class="bumper-content-container"><a data-analytics-get-slate class="logo" href="{{{ getUrl }}}"></a><div class="made-with"><p class="tagline">Made with <strong>Adobe Slate</strong></p><p>Make your words and images move.</p></div><a data-analytics-get-slate href="{{{ getUrl }}}" class="button">Get Slate</a></div></div><!--BUMPER-CONTENT-END--><!--FOOTER-START--><div class="footer"><span class="copyright">&copy; Adobe. All rights reserved.</span><span class="tos"><a target="_blank" href="http://www.adobe.com/go/slate-terms-of-use" rel="nofollow">Terms of Service</a></span><span class="privacy"><a target="_blank" href="http://www.adobe.com/go/privacy" rel="nofollow">Privacy Policy</a></span><span class="report-abuse"><a class="js-report-abuse" href="#" rel="nofollow">Report Abuse</a></span></div><!--FOOTER-END--></div></div><!--BUMPER-SECTION-TOP-LEVEL-END-->',"cookie_banner.css" : '.cookie-banner {background-color: rgba(255, 255, 255, 0.9);bottom: 0;font-family: adobe-clean,sans-serif;font-size: 14px;max-height: 100%;position: fixed;width: 100%;z-index: 100;}.cookie-banner.hiding {-webkit-animation: show 1s 0s, fadeOut 1s 1s;animation: show 1s 0s, fadeOut 1s 1s;opacity: 0;z-index: -1;}@-webkit-keyframes fadeOut {from { opacity: 1; z-index: 100; }to { opacity: 0; z-index: -1;}}@keyframes fadeOut {from { opacity: 1; z-index: 100; }to { opacity: 0; z-index: -1; }}@-webkit-keyframes show {from { opacity: 1; z-index: 100; }to { opacity: 1; z-index: 100;}}@keyframes show {from { opacity: 1; z-index: 100; }to { opacity: 1; z-index: 100; }}.cookie-banner .cookie-banner-view {position: relative;}.cookie-banner .cookie-banner-wrapper {align-items: center;display: flex;justify-content: center;margin-left: auto;margin-right: auto;padding: 14px 80px;}div.cookie-banner-text {color: rgb(53, 65, 76);font-family: adobe-clean,sans-serif;font-size: 13px;font-weight: 400;line-height: 1.5;margin-bottom: 0;margin-left: 5px;margin-right: 12px;margin-top: 0;}.cookie-banner .cookie-banner-cta {background-color: transparent;border-radius: 40px;border: 2px solid rgb(130,145,155);box-sizing: border-box;color: rgb(130,145,155);cursor: pointer;display: inline-block;font-family: adobe-clean,sans-serif;font-size: 14px;font-weight: 600;line-height: 1;padding: 8px 15px 9px 15px;position: relative;text-align: center;text-decoration: none;vertical-align: middle;width: auto;white-space: nowrap;-webkit-font-smoothing: antialiased;-webkit-transition: color .15s linear,border-color .15s linear;-moz-transition: color .15s linear,border-color .15s linear;-o-transition: color .15s linear,border-color .15s linear;-ms-transition: color .15s linear,border-color .15s linear;transition: color .15s linear,border-color .15s linear;}@media only screen and (max-width: 480px) {.cookie-banner {background-color: transparent;}.cookie-banner .cookie-banner-wrapper {margin-right: 0;margin-left: 0;padding: 0;position: relative;}.cookie-banner-text-wrapper {max-height: 100vh;position: relative;bottom: 60px;overflow: auto;}div.cookie-banner-text {background-color: rgba(255, 255, 255, 0.9);margin-right: 0;margin-left: 0;margin-top: 60px;padding: 14px 40px 0 40px;overflow: auto;}.cookie-banner .cookie-banner-cta {display: block;margin: 10px auto 0 auto;}.cookie-banner-cta-wrapper {background-color: rgba(255, 255, 255, 0.9);display: block;position: fixed;bottom: 0;left: 0;height: 60px;right: 0;}}',"cookie_banner" : '<div class="cookie-banner"><div class="cookie-banner-view"><!--BANNER-START--><div class="cookie-banner-wrapper"><div class="cookie-banner-text-wrapper"><div class="cookie-banner-text">{{#bannerText }}<p>{{.}}</p>{{/bannerText }}</div></div><div class="cookie-banner-cta-wrapper"><button class="cookie-banner-cta">{{ bannerCTA }}</button></div></div><!--BANNER-END--></div></div>',"google_analytics" : '<!-- Global site tag (gtag.js) - Google Analytics --><script async src="{{{ google_analytics_url }}}"></script><script>window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}gtag(\'js\', new Date());gtag(\'config\', \'{{ google_analytics_id }}\' );</script>',"report_abuse.css" : '.banner {font-family: adobe-clean, sans-serif;position: absolute;top: 0;left: 0;right: 0;z-index: 1;min-height: 75px;font-weight: 300;color: #FFFFFF;display: none;-webkit-box-align: center;-moz-box-align: center;box-align: center;-webkit-align-items: center;-moz-align-items: center;-ms-align-items: center;-o-align-items: center;align-items: center;-ms-flex-align: center;-webkit-box-pack: center;-moz-box-pack: center;box-pack: center;-webkit-justify-content: center;-moz-justify-content: center;-ms-justify-content: center;-o-justify-content: center;justify-content: center;-ms-flex-pack: center;}.banner a {color: #FFFFFF;}.banner.success {background-color: #147ACC;}.banner.error {background-color: #E20404;}.banner.show {display: -webkit-box;display: -moz-box;display: box;display: -webkit-flex;display: -moz-flex;display: -ms-flexbox;display: flex;opacity: 0;-webkit-animation: fadeOut 5s ease-in;-moz-animation: fadeOut 5s ease-in;animation: fadeOut 5s ease-in;}.banner .message {text-align: center;font-size: 1.1rem;}.banner .message a {color: #FFFFFF;text-decoration: underline;}@-webkit-keyframes fadeOut {0% {opacity: 1;}75% {opacity: 1;}100% {opacity: 0;}}@-moz-keyframes fadeOut {0% {opacity: 1;}75% {opacity: 1;}100% {opacity: 0;}}@keyframes fadeOut {0% {opacity: 1;}75% {opacity: 1;}100% {opacity: 0;}}@media only screen and (max-width: 480px) {.banner .message {font-size: 2.2rem;}}.spinner-modal {z-index: 2;display: none;position: absolute;top: 0;right: 0;bottom: 0;left: 0;background: rgba(255, 255, 255, 0.8);}.spinner-modal.show {display: block;}.spinner-modal-spinner {background-image: url(images/report-abuse-spinner.png);background-repeat: no-repeat;background-size: 100% 100%;width: 52px;height: 52px;-webkit-transition: -webkit-transform 0.75s;-moz-transition: -moz-transform 0.75s;transition: transform 0.75s;-webkit-animation: rotate 0.75s infinite linear;-moz-animation: rotate 0.75s infinite linear;animation: rotate 0.75s infinite linear;position: absolute;top: 50%;left: 50%;margin-top: -26px;margin-left: -26px;}@-webkit-keyframes rotate {from {-webkit-transform: rotate(0deg);-moz-transform: rotate(0deg);-ms-transform: rotate(0deg);-o-transform: rotate(0deg);transform: rotate(0deg);}to {-webkit-transform: rotate(360deg);-moz-transform: rotate(360deg);-ms-transform: rotate(360deg);-o-transform: rotate(360deg);transform: rotate(360deg);}}@-moz-keyframes rotate {from {-webkit-transform: rotate(0deg);-moz-transform: rotate(0deg);-ms-transform: rotate(0deg);-o-transform: rotate(0deg);transform: rotate(0deg);}to {-webkit-transform: rotate(360deg);-moz-transform: rotate(360deg);-ms-transform: rotate(360deg);-o-transform: rotate(360deg);transform: rotate(360deg);}}@keyframes rotate {from {-webkit-transform: rotate(0deg);-moz-transform: rotate(0deg);-ms-transform: rotate(0deg);-o-transform: rotate(0deg);transform: rotate(0deg);}to {-webkit-transform: rotate(360deg);-moz-transform: rotate(360deg);-ms-transform: rotate(360deg);-o-transform: rotate(360deg);transform: rotate(360deg);}}.report-abuse-dialog {font-family: adobe-clean, "Helvetica Neue", Helvetica, Arial, sans-serif;position: absolute;display: none;top: 0;left: 0;width: 100%;z-index: 10000;font-family: adobe-clean,"Helvetica Neue",Helvetica,Arial,sans-serif;line-height: 1.5;font-style: normal;font-weight: 300;color: #444;}.report-abuse-dialog.show {display: block;}.report-abuse-dialog a {color: #555555;cursor: pointer;}.report-abuse-dialog ul {margin: 0;padding: 0;border: 0;font-size: 100%;font: inherit;vertical-align: baseline;list-style: none;}.report-abuse-dialog .invalid-message, .report-abuse-dialog .required-message {color: red;margin-left: 5px;display: none;}.report-abuse-dialog .field.invalid .invalid-message {display: inline;}.report-abuse-dialog .field.required .required-message {display: inline;}.report-abuse-dialog .group:after {content: ".";display: block;height: 0;clear: both;visibility: hidden;}.report-abuse-dialog p, .report-abuse-dialog ul, .report-abuse-dialog label {font-size: 14px;font-size: .875rem;line-height: 18px;font-weight: 400;color: #444;}.report-abuse-dialog li:last-of-type {margin-bottom: none;}.report-abuse-dialog .report-abuse-dialog-scrim {position: fixed;top: 0;left: 0;width: 100%;height: 100%;background: #000;opacity: .60;filter: alpha(opacity=60);}.report-abuse-dialog .report-abuse-dialog-content {width: 50%;min-width: 280px;max-width: 500px;background: #fff;position: relative;margin: 65px auto 0;padding: 10px;}.report-abuse-dialog .report-abuse-dialog-content-inner {padding-top: 42px;background: #fff;}.report-abuse-dialog .header {position: absolute;top: 0;left: 10px;right: 10px;background: white;word-wrap: break-word;z-index: 10;padding: 16px 18px 0;}.report-abuse-dialog .article {position: relative;padding: 12px 18px 22px 18px;border-top: 1px solid rgba(255, 255, 255, 0.9);}.report-abuse-dialog .report-abuse-dialog-article-contents {-webkit-tap-highlight-color: transparent;}.report-abuse-dialog .header .dialog-title {font-family: adobe-clean, "Helvetica Neue", Helvetica, Arial, sans-serif;margin: 0;font-size: 1.5rem;font-weight: 400;line-height: 1.4;color: #000;word-wrap: break-word;}.report-abuse-dialog .report-abuse-dialog-content .btn-close {z-index: 11;position: absolute;right: 2px;top: 10px;background: transparent;border: 0;width: auto;opacity: .5;-ms-filter: "alpha(Opacity=50)";-webkit-transition: opacity .25s ease-in;-moz-transition: opacity .25s ease-in;-o-transition: opacity .25s ease-in;-ms-transition: opacity .25s ease-in;transition: opacity .25s ease-in;}.report-abuse-dialog .report-abuse-dialog-content .btn-close em {display: block;width: 30px;height: 30px;text-indent: -9999em;margin: 0 auto;}.report-abuse-dialog .report-abuse-dialog-content .btn-close:hover {opacity: .8;-ms-filter: "alpha(Opacity=80)";}.report-abuse-dialog .report-abuse-dialog-content .btn-close:active {box-shadow: none;}.report-abuse-dialog .report-abuse-dialog-content .btn-close:active {background: 0;border: 0;outline: 0;}.report-abuse-dialog .report-abuse-dialog-content .btn-close:hover {cursor: pointer;}.report-abuse-dialog .report-abuse-dialog_error {display: none;color: #333;white-space: normal;background: #fff38e;padding: 15px;margin-top: 10px;font-weight: 400;border: 1px solid #dbde7e;}/* REPORT ABUSE */.report-abuse-report-abuse-dialog .report-abuse-dialog .report-abuse-dialog-content {max-width: 450px;}.report-abuse-form button {width: 100%;}.report-abuse-form ul, .report-abuse-form p {margin-bottom: 10px;}.report-abuse-form ul.checkbox li {display: inline-block;width: 30%;}.report-abuse-form ul.radio li {vertical-align: top;display: inline-block;width: 49%;}.report-abuse-form ul.info li {width: 48%;float: left;}.report-abuse-form ul.info li:last-of-type {margin-left: 4%;}.report-abuse-form input[type=text], .report-abuse-form input[type=email], .report-abuse-form textarea {display: block;width: 100%;resize: none;padding: 0;font-size: 14px;font-size: .875rem;border: 1px solid #d8d8d8;background: #fff;outline: none;font-family: adobe-clean,"Helvetica Neue",Helvetica,Arial,sans-serif;}.report-abuse-form input[type=text], .report-abuse-form input[type=email] {height: 30px;text-indent: 5px;margin-bottom: 10px;}.report-abuse-form textarea {width: 98%;padding: 1%;height: 55px;}.report-abuse-form label {margin: 5px 0;line-height: 1.5;}.report-abuse-form label em {font-weight: bold;}.report-abuse-form label b {color: red;font-weight: bold;display: block;margin: -1px 0 2px 0;}.report-abuse-form input[type=checkbox], .report-abuse-form input[type=radio] {float: left;margin-right: 4px;width: 20px;height: 20px;}.report-abuse-form input[type=radio] {margin-top: 2px;}@-moz-document url-prefix() {.report-abuse-form input[type=checkbox], .report-abuse-form input[type=radio] {position: relative;top: -2px;margin-right: 7px;}}.report-abuse-form button.btn-submit {margin-bottom: 5px;}.banner {font-family:adobe-clean,"Helvetica Neue",Helvetica,Arial,sans-serif;}@media only screen and (max-width: 600px) {.report-abuse-form ul.checkbox li {width: 100%;}.report-abuse-form ul.radio li {width: 100%;}.report-abuse-form ul.info li {width: 100%;float: none;}.report-abuse-form ul.info li:last-of-type {margin-left: 0;}}.report-abuse-dialog button:focus {outline: 0;}.report-abuse-dialog .sprite30x30 {background-image: url("images/close-report-abuse.png");background-size: 30px;}.report-abuse-dialog .buttons {margin-top: 10px;display: -webkit-box;display: -moz-box;display: box;display: -webkit-flex;display: -moz-flex;display: -ms-flexbox;display: flex;-webkit-box-pack: justify;-moz-box-pack: justify;box-pack: justify;-webkit-justify-content: space-between;-moz-justify-content: space-between;-ms-justify-content: space-between;-o-justify-content: space-between;justify-content: space-between;-ms-flex-pack: justify;}.report-abuse-dialog .buttons > * {display: block;max-width: 47%;}.report-abuse-dialog .button {font-family: inherit;cursor: pointer;-webkit-appearance: none;outline: none;width: 100%;border-radius: 5px;border: 2px solid #666;background-color: #666;text-decoration: none;color: white;padding: 0.7em 0.9em;font-size: 0.9rem;font-size: 300;}.report-abuse-dialog .button.cancel {background-color: white;color: #666666;}.report-abuse-dial .button.full {width: 100%;}.report-abuse-dialog .notice {margin-bottom: 0;}@media only screen and (max-width: 480px), screen and (min-device-width: 320px) and (max-device-width: 568px) and (orientation: landscape) {.report-abuse-dialog {position: absolute;top: 0;right: 0;bottom: 0;left: 0;}.report-abuse-dialog .report-abuse-dialog-content {position: absolute;top: 2rem;left: 2rem;bottom: 2rem;right: 2rem;overflow: hidden;max-height: 710px;width: auto;}.report-abuse-dialog .report-abuse-dialog-content-inner {height: 100%;overflow-y: auto;-webkit-overflow-scrolling: touch;}.report-abuse-dialog .report-abuse-dialog-content {margin-top: 0;}.report-abuse-dialog p, .report-abuse-dialog ul, .report-abuse-dialog label {font-size: 1.5rem;}.report-abuse-dialog .header h1 {font-size: 2.5rem;}.report-abuse-form input[type=text], .report-abuse-form input[type=email], .report-abuse-form textarea {font-size: 1.5rem;}.report-abuse-dialog .buttons {-webkit-box-orient: vertical;-moz-box-orient: vertical;box-orient: vertical;-webkit-box-direction: reverse;-moz-box-direction: reverse;box-direction: reverse;-webkit-flex-direction: column-reverse;-moz-flex-direction: column-reverse;flex-direction: column-reverse;-ms-flex-direction: column-reverse;}.report-abuse-dialog .buttons > * {font-size: 1.5rem;margin-bottom: 1rem;width: 100%;max-width: 100%;}}* {-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;}',"report_abuse" : '<div class="banner success js-report-success"><p class="message">Your report has been submitted.</p></div><div class="banner error js-report-error"><p class="message">There was a problem submitting your report. Please contact <a href="http://helpx.adobe.com/support.html">Adobe Support</a>.</p></div><div class="report-abuse-dialog js-report-abuse-dialog"><div class="report-abuse-dialog-scrim"> </div><div class="report-abuse-dialog-content"><div class="spinner-modal js-spinner-modal"><div class="spinner-modal-spinner"></div></div><div class="header"><p class="dialog-title">Report Abuse</p><button title="Close" class="btn-close btn-reportabuse-close js-report-abuse-close"><em class="sprite30x30">Close</em></button></div><div class="report-abuse-dialog-content-inner"><div class="article"><div class="report-abuse-dialog-article-contents"><form class="report-abuse-form js-report-abuse-form"><p>If you feel that the content of this page violates the Adobe <a href="http://www.adobe.com/go/tou" target="_blank">Terms of Use</a>, you may report this content by filling out this quick form.</p><ul class="group info"><li class="field" data-required="true" data-type="email"><label id="email-label" for="email"><strong>Your Email</strong> <strong class="required-message">Required</strong> <strong class="invalid-message">Invalid</strong><b></b></label><input id="email" name="email" type="email"></li><li class="field" data-required="true"><label id="name-label" for="name"><strong>Your Name</strong> <strong class="required-message">Required</strong><b></b></label><input id="name" name="name" type="text"></li></ul><p></p><div class="field" data-required="true"><label id="radio-label"><strong>Why are you reporting this content?</strong> <strong class="required-message">Required</strong><b></b></label><ul class="radio"><li><input type="radio" id="def" name="type" value="defamation"><label for="def">Defamation</label></li><li><input type="radio" id="tra" name="type" value="trademark"><label for="tra">Trademark Infringement</label></li><li><input type="radio" id="off" name="type" value="vulgar"><label for="off">Offensive Content</label></li><li><input type="radio" id="rac" name="type" value="hate"><label for="rac">Racist or Hate Content</label></li><li><input type="radio" id="exp" name="type" value="pornography"><label for="exp">Sexually Explicit Content</label></li><li><input type="radio" id="oth" name="type" value="other"><label for="oth">Other</label></li></ul></div><ul><li class="field" data-required="true"><label id="desc-label"><strong>Please provide a description of your concern.</strong> <strong class="required-message">Required</strong><b></b></label><textarea maxlength="1024" name="description" rows="4" id="description"></textarea></li></ul><p class="notice">To report a copyright violation, please follow the DMCA section in the <a href="http://www.adobe.com/go/tou" target="_blank">Terms of Use</a>.</p><div class="buttons"><button type="button" class="button cancel js-report-abuse-cancel">Cancel </button><input type="submit" class="button" value="Report Abuse" ></div></form></div><!--dialog-article-contents--></div><!--article--></div><!--dialog-content-inner--></div><!--dialog-content--></div><!--report-abuse-dialog-->',"spark_bumper_ios" : '<div class="section spark-bumper-section visible" data-section-behavior="spark-bumper" data-layer-name="under" data-layer="-1"><div class="section-view"><!--BUMPER-CONTENT-START--><div class="bumper-content"><div class="bumper-content-container"><span class="made-with">Made with</span><a class="spark-page-logo logo" href="https://c00.adobe.com/v3/2c18a4dd7ed9e6bff783299fe0861806c9f14220edc8b0d08d613ccb7b9cae6c/start?a_dl=572d19a1547a4e7049fa5ffa{{# pageId }}&ctxmy.viralityId={{ pageId }}{{/ pageId }}" data-analytics-get-slate=""></a><span class="adobe-spark-page">Adobe Spark Page</span><span class="tag-line">Turn words and images into beautiful web stories&mdash;in minutes <a class="learn-more inline" href="https://spark.adobe.com/about/page?r=reader_page_learnmore">Learn more.</a></span><a class="get-spark-page button" href="https://c00.adobe.com/v3/2c18a4dd7ed9e6bff783299fe0861806c9f14220edc8b0d08d613ccb7b9cae6c/start?a_dl=572d19a1547a4e7049fa5ffa{{# pageId }}&ctxmy.viralityId={{ pageId }}{{/ pageId }}" data-analytics-get-slate="">Get Spark Page</a><a class="learn-more block" href="https://spark.adobe.com/about/page?r=reader_page_learnmore">Learn more.</a></div></div><!--BUMPER-CONTENT-END--><!--FOOTER-START--><div class="footer"><span class="copyright">© {{ currentYear }} Adobe. All rights reserved.</span><span class="tos"><a target="_blank" href="http://www.adobe.com/legal/terms.html" rel="nofollow">Terms of Service</a></span><span class="privacy"><a target="_blank" href="http://www.adobe.com/go/privacy" rel="nofollow">Privacy Policy</a></span><span class="report-abuse"><a class="js-report-abuse" href="#" target="_blank" rel="nofollow">Report Abuse</a></span><span class="adobe-logo"></span></div><!--FOOTER-END--></div></div>',"spark_bumper_mobile" : '<div class="section spark-bumper-section visible" data-section-behavior="spark-bumper" data-layer-name="under" data-layer="-1"><div class="section-view"><!--BUMPER-CONTENT-START--><div class="bumper-content"><div class="bumper-content-container"><span class="made-with">Made with</span><a class="spark-page-logo logo" href="https://spark.adobe.com/about?r=reader_page_logo" data-analytics-get-slate=""></a><span class="adobe-spark-page">Adobe Spark Page</span><span class="tag-line">Turn words and images into beautiful web stories&mdash;in minutes <a class="learn-more inline" href="https://spark.adobe.com/about/page?r=reader_page_learnmore">Learn more.</a></span><a class="get-spark-page button" href="https://spark.adobe.com/login?r=reader_page_bumper_createyourown" data-analytics-get-slate="">Get Spark Page</a><a class="learn-more block" href="https://spark.adobe.com/about/page?r=reader_page_learnmore">Learn more.</a></div></div><!--BUMPER-CONTENT-END--><!--FOOTER-START--><div class="footer"><span class="copyright">© {{ currentYear }} Adobe. All rights reserved.</span><span class="tos"><a target="_blank" href="http://www.adobe.com/legal/terms.html" rel="nofollow">Terms of Service</a></span><span class="privacy"><a target="_blank" href="http://www.adobe.com/go/privacy" rel="nofollow">Privacy Policy</a></span><span class="report-abuse"><a class="js-report-abuse" href="#" target="_blank" rel="nofollow">Report Abuse</a></span><span class="adobe-logo"></span></div><!--FOOTER-END--></div></div>',"spark_bumper.css" : '.sections-article-layout {/* bumper-section */ }.sections-article-layout .spark-bumper-section {max-height: 100%;bottom: auto;background-color: #35414d;-webkit-font-smoothing: antialiased;/* section-view */ }.sections-article-layout .spark-bumper-section .section-view {position: relative; }/* sections-article-layout */.spark-bumper-section {font-family: adobe-clean, sans-serif;font-size: 12px;font-weight: 300;line-height: 1;color: #82939d;/* bumper-content *//* footer */ }.spark-bumper-section .bumper-content {padding: 62px 0;text-align: center;/* button */ }.spark-bumper-section .bumper-content .made-with {display: block; }.spark-bumper-section .bumper-content .adobe-spark-page {display: inline-block;/* Needed for transforms */font-size: 28px;font-weight: 800;color: #e6eaed;vertical-align: middle; }.spark-bumper-section .bumper-content .logo {display: inline-block;margin-right: 10px;width: 42px;height: 42px;background-size: 100% 100%;background-repeat: no-repeat;vertical-align: middle; }.spark-bumper-section .bumper-content .spark-logo {background-image: url(https://s3.amazonaws.com/adobe-luca-prod-ue1-assets/experiments/chrome/images/spark_logo_v2.svg); }.spark-bumper-section .bumper-content .spark-page-logo {background-image: url(https://s3.amazonaws.com/adobe-luca-prod-ue1-assets/experiments/chrome/images/spark_page_logo_v2.svg); }.spark-bumper-section .bumper-content .tag-line {display: block;margin: 18px 0 31px 0;font-size: 16px;line-height: 1.5; }.spark-bumper-section .bumper-content .learn-more {color: #82939d;text-decoration: underline; }.spark-bumper-section .bumper-content .learn-more.block {display: none;margin-top: 28px;font-size: 16px; }.spark-bumper-section .bumper-content a.button {display: inline-block;cursor: pointer;-webkit-appearance: none;outline: none;margin-left: 0;border-radius: 1.5em;border: none;padding-left: 1.25em;padding-right: 1.25em;padding-top: 0.45em;padding-bottom: 0.6em;background-color: #dce0e3;color: #27475e;line-height: 1;font-family: inherit;font-size: 16px;font-weight: 600;white-space: pre;text-decoration: none;-webkit-transition: background-color 0.2s, color 0.2s;-moz-transition: background-color 0.2s, color 0.2s;transition: background-color 0.2s, color 0.2s; }.spark-bumper-section .bumper-content a.button:hover {background-color: #fff;color: #20282f; }.spark-bumper-section .footer {padding: 1.5rem 0.5rem;max-width: none;margin: 0 5%;font-size: 12px;line-height: 1.5;color: #82939d;border-top: 1px solid #6e7a86;display: -webkit-box;display: -moz-box;display: box;display: -webkit-flex;display: -moz-flex;display: -ms-flexbox;display: flex;-webkit-box-pack: justify;-moz-box-pack: justify;box-pack: justify;-webkit-justify-content: space-between;-moz-justify-content: space-between;-ms-justify-content: space-between;-o-justify-content: space-between;justify-content: space-between;-ms-flex-pack: justify;-webkit-box-align: center;-moz-box-align: center;box-align: center;-webkit-align-items: center;-moz-align-items: center;-ms-align-items: center;-o-align-items: center;align-items: center;-ms-flex-align: center;/* adobe-logo */ }.spark-bumper-section .footer > * {color: #82939d;font-weight: 300;padding: 0 0.5rem 0 0; }.spark-bumper-section .footer a {color: #82939d;text-decoration: none;font-weight: inherit; }.spark-bumper-section .footer > *:last-child {padding-right: 0; }.spark-bumper-section .footer .privacy {-webkit-box-flex: initial;-moz-box-flex: initial;box-flex: initial;-webkit-flex: initial;-moz-flex: initial;-ms-flex: initial;flex: initial; }.spark-bumper-section .footer .report-abuse {-webkit-box-flex: 1;-moz-box-flex: 1;box-flex: 1;-webkit-flex: 1;-moz-flex: 1;-ms-flex: 1;flex: 1; }.spark-bumper-section .footer .adobe-logo {position: relative; }.spark-bumper-section .footer .adobe-logo:before {content: \'\';display: inline-block;width: 70px;height: 16px;vertical-align: middle;background-size: contain;background-image: url(https://s3.amazonaws.com/adobe-luca-prod-ue1-assets/experiments/base/images/adobe-logo-gray.png);background-repeat: no-repeat;background-position: center; }/* spark-bumper-section*//* Switch to a 2 line footer format for narrow widths */@media only screen and (max-width: 680px) {/* spark-bumper-content */.spark-bumper-section {/* footer */ }.spark-bumper-section .footer {display: block;padding-top: 17px;padding-bottom: 30px; }.spark-bumper-section .footer .copyright {display: block;margin-bottom: 8px; }.spark-bumper-section .footer > * {padding-right: 16px; }.spark-bumper-section .footer .adobe-logo {float: right; }.spark-bumper-section .footer a {text-decoration: underline; } }/* Switch to vertically stacked bumper content for the phone form factor. */@media only screen and (max-width: 480px) {/* spark-bumper-content */.spark-bumper-section {/* bumper-content */ }.spark-bumper-section .bumper-content {padding-bottom: 42px; }.spark-bumper-section .bumper-content .logo {display: block;margin: 20px auto 13px auto;width: 54px;height: 54px; }.spark-bumper-section .bumper-content .learn-more.inline {display: none; }.spark-bumper-section .bumper-content .learn-more.block {display: block;margin-top: 24px; }.spark-bumper-section .bumper-content .tag-line {margin-top: 17px;margin-bottom: 47px;margin-right: auto;margin-left: auto;max-width: 14em; } }/* media max-width:480px *//* For Phones with extremely small widths, we need to reduce the * logo and font-sizes so that things fit a bit better within the available * viewport. */@media only screen and (max-width: 320px), only screen and (max-device-width: 320px) and (orientation: landscape) {.spark-bumper-section {/* bumper-content *//* footer */ }.spark-bumper-section .bumper-content {padding: 24px 0; }.spark-bumper-section .bumper-content .logo {display: inline-block;margin: 0 10px 0 0;width: 40px;height: 40px; }.spark-bumper-section .bumper-content .adobe-spark-page {font-size: 24px; }.spark-bumper-section .bumper-content .tag-line {font-size: 14px;margin-bottom: 17px; }.spark-bumper-section .bumper-content a.button {font-size: 14px; }.spark-bumper-section .bumper-content .learn-more.block {margin-top: 17px;font-size: 14px; }.spark-bumper-section .footer {padding-top: 4px;padding-bottom: 4px; }.spark-bumper-section .footer .copyright {display: block;margin-bottom: 4px; } }/* For Phones with extremely small widths, we stack the contents of the footer * so we end up with a footer of 3 centered lines. */@media only screen and (max-width: 320px) {/* spark-bumper-section */.spark-bumper-section {/* footer */ }.spark-bumper-section .footer {text-align: center;/* adobe-logo */ }.spark-bumper-section .footer .adobe-logo {float: none;display: block;margin: 8px; }.spark-bumper-section .footer .adobe-logo:before {height: 12px; } }/* For phones with extremely small widths, we need to hide the tag-line when in * landscape mode so that we can fit the main content and footer within the viewport. * Add to this the problem where on iPhone 4/5 faux scrolling prevents the browser from * hiding the URL and navigation bars, further reducing the size of the viewport. */@media only screen and (max-device-width: 320px) and (orientation: landscape) {.spark-bumper-section .bumper-content {/* We hide the tag-line by giving it a zero-width so that it still has a position * in the flow so the section-behavior can still animate the button after it which * calculates its timing based on the tag-line position. */ }.spark-bumper-section .bumper-content .tag-line {overflow: hidden;height: 0;margin-bottom: 0; }.spark-bumper-section .bumper-content .learn-more.inline {display: none; }.spark-bumper-section .bumper-content .learn-more.block {display: block; }.spark-bumper-section .footer {/* Our faux-scrolling prevents the iphone 4/5 from hiding it\'s browser chrome * so we need to push the footer up above the navigation bar with a margin so * that it can be seen. */margin-bottom: 50px;/* adobe-logo */ }.spark-bumper-section .footer .adobe-logo:before {height: 12px; } }.credits-in-bumper .sections-article-layout .section.credits-section {background-color: #35414d;color: #82939d;}',"spark_bumper" : '<div class="section spark-bumper-section visible" data-section-behavior="spark-bumper" data-layer-name="under" data-layer="-1"><div class="section-view"><!--BUMPER-CONTENT-START--><div class="bumper-content"><div class="bumper-content-container"><span class="made-with">Made with</span><a class="spark-logo logo" href="https://spark.adobe.com/about?r=reader_page_logo" data-analytics-get-slate=""></a><span class="adobe-spark-page">Adobe Spark Page</span><span class="tag-line">Give your logo a refresh with Spark. <a class="learn-more inline" href="https://spark.adobe.com/make/logo-maker?r=reader_page_learnmore">Learn more.</a></span><a class="create-your-own button" href="https://spark.adobe.com/login?r=reader_page_bumper_createyourown" data-analytics-get-slate="">Create your own</a><a class="learn-more block" href="https://spark.adobe.com/make/logo-maker?r=reader_page_learnmore">Learn more.</a></div></div><!--BUMPER-CONTENT-END--><!--FOOTER-START--><div class="footer"><span class="copyright">© {{ currentYear }} Adobe. All rights reserved.</span><span class="tos"><a target="_blank" href="http://www.adobe.com/legal/terms.html" rel="nofollow">Terms of Service</a></span><span class="privacy"><a target="_blank" href="http://www.adobe.com/go/privacy" rel="nofollow">Privacy Policy</a></span><span class="report-abuse"><a class="js-report-abuse" href="#" target="_blank" rel="nofollow">Report Abuse</a></span><span class="adobe-logo"></span></div><!--FOOTER-END--></div></div>',"un_branded_bumper.css" : '.sections-article-layout .un-branded-bumper-section {max-height: 100%;bottom: auto;background-color: #35414d;color: #82939d;font-family: adobe-clean, sans-serif;font-size: 12px;font-weight: 300;line-height: 1;-webkit-font-smoothing: antialiased;}.sections-article-layout .un-branded-bumper-section .section-view {position: relative;}.un-branded-bumper-section .footer {padding: 24px 8px;max-width: none;margin: 0 5%;color: #82939d;font-size: 12px;line-height: 1.5;text-align: center;}.un-branded-bumper-section .footer a {display: inline-block;white-space: nowrap;padding: 0 8px 0 0;color: #82939d;text-decoration: none;font-weight: 300;}.credits-in-bumper .sections-article-layout .section.credits-section {background-color: #35414d;color: #82939d;}@media ( max-width: 480px ) {.un-branded-bumper-section .footer {padding: 13.5px 4.5px;}.un-branded-bumper-section .footer a {padding: 0 4.5px 0 0;}}',"un_branded_bumper" : '<div class="section bumper-section un-branded-bumper-section visible" data-layer-name="under" data-layer="-1"><div class="section-view"><!--FOOTER-START--><div class="footer"><a class="tos" target="_blank" href="http://www.adobe.com/legal/terms.html" rel="nofollow">Terms of Service</a><a class="privacy" target="_blank" href="http://www.adobe.com/go/privacy" rel="nofollow">Privacy Policy</a><a class="js-report-abuse" href="#" target="_blank" rel="nofollow">Report Abuse</a></div><!--FOOTER-END--></div></div>',"spark_header_ios" : '<div class="section spark-header-section" data-section-behavior="spark-header" data-layer-name="over"><div class="section-view"><div class="spark-header"><div class="branding"><a class="adobe-spark" href="https://spark.adobe.com/about?r=reader_page_logo">Adobe Spark</a></div><div class="actions"><a class="create-your-own button" href="https://c00.adobe.com/v3/2c18a4dd7ed9e6bff783299fe0861806c9f14220edc8b0d08d613ccb7b9cae6c/start?a_dl=572d19fd547a4e7049fa5ffc{{# pageId }}&ctxmy.viralityId={{ pageId }}{{/ pageId }}" data-analytics-get-slate="">Create your own</a></div></div></div></div>',"spark_header_mobile" : '<div class="section spark-header-section" data-section-behavior="spark-header" data-layer-name="over"><div class="section-view"><div class="spark-header"><div class="branding"><a class="adobe-spark" href="https://spark.adobe.com/about?r=reader_page_logo">Adobe Spark</a></div><div class="actions"><a class="create-your-own button" href="https://spark.adobe.com/login?r=reader_page_topbar_createyourown" data-analytics-get-slate="">Create your own</a></div></div></div></div>',"spark_header.css" : '.spark-header {font-family: adobe-clean, sans-serif;font-weight: 400;-webkit-font-smoothing: antialiased;}.spark-header .branding {position: absolute;top: 0;bottom: 0;left: 0;}.spark-header .actions {position: absolute;top: 0;bottom: 0;right: 0;}.spark-header a.adobe-spark {display: block;background-image: url(https://s3.amazonaws.com/adobe-luca-prod-ue1-assets/experiments/chrome/images/spark_logo_v2.svg);background-position: left center;background-repeat: no-repeat;background-size: 32px 31px;vertical-align: middle;font-weight: 800;color: #82919b}.spark-header .branding a,.spark-header .actions a {text-decoration: none;pointer-events: auto;}.spark-header .actions a {color: #82919b;}/***************/.spark-header.floater {z-index: 10;position: absolute;top: 0;right: 0;left: 0;height: 55px;background-color: rgba(255,255,255,0.96);pointer-events: none;-webkit-transform:translate3d(0,-110%,0); -moz-transform:translate3d(0,-110%,0);-ms-transform:translate3d(0,-110%,0); -o-transform:translate3d(0,-110%,0);transform:translate3d(0,-110%,0);-webkit-transition: -webkit-transform 0.3s, background-color 0.5s; -moz-transition:-moz-transform 0.3s, background-color 0.5s;-ms-transition: -ms-transform 0.3s, background-color 0.5s; -o-transition:-o-transform 0.3s, background-color 0.5s;transition: transform 0.3s, background-color 0.5s;}.spark-header.floater.show {-webkit-transform:translate3d(0,0,0); -moz-transform:translate3d(0,0,0);-ms-transform:translate3d(0,0,0); -o-transform:translate3d(0,0,0);transform:translate3d(0,0,0);}.spark-header.floater.above-the-fold {background-color: rgba(255,255,255,0);}@-webkit-keyframes spark-header-fade-in {0% {opacity: 0;}100% {opacity: 1;}}@-moz-keyframes spark-header-fade-in {0% {opacity: 0;}100% {opacity: 1;}}@-o-keyframes spark-header-fade-in {0% {opacity: 0;}100% {opacity: 1;}}@-ms-keyframes spark-header-fade-in {0% {opacity: 0;}100% {opacity: 1;}}@keyframes spark-header-fade-in {0% {opacity: 0;}100% {opacity: 1;}}.spark-header.floater.above-the-fold:before {content: \'\';position: absolute;opacity: 1;left: 0;top: 0;right: 0;height: 90px;background: rgba(0,0,0,0.6);background: -moz-linear-gradient(top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 85%);background: -webkit-gradient(left top, left bottom, color-stop(0%, rgba(0,0,0,0.6)), color-stop(85%, rgba(0,0,0,0)));background: -webkit-linear-gradient(top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 85%);background: -o-linear-gradient(top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 85%);background: -ms-linear-gradient(top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 85%);background: linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 85%);-webkit-animation: 0.5s linear spark-header-fade-in; -moz-animation: 0.5s linear spark-header-fade-in; -o-animation: 0.5s linear spark-header-fade-in;-ms-animation: 0.5s linear spark-header-fade-in;animation: 0.5s linear spark-header-fade-in;}.spark-header.floater .branding,.article .spark-header .actions,.article .spark-header a.adobe-spark {line-height: 55px;}.spark-header.floater .branding {padding: 0 30px;}.spark-header.floater a.adobe-spark {padding-left: 40px;font-size: 20px;color: #370000;-webkit-transition: color 0.5s; -moz-transition: color 0.5s;-ms-transition: color 0.5s; -o-transition: color 0.5s;transition: color 0.5s;}.spark-header.floater.above-the-fold a.adobe-spark {color: #fff;}.spark-header.floater .actions {padding: 0 30px;}.spark-header.floater .actions .button {display: inline-block;line-height: 1;margin-bottom: 6px;border: 2px solid #1473E6;border-radius: 40px;padding: 8px 20px 9px 20px;background-color: #1473E6;color: rgba(255,255,255,1);font-size: 15px;font-weight: 700;vertical-align: middle;-webkit-transition: border-color 0.5s, background-color 0.5s, color 0.5s; -moz-transition: border-color 0.5s, background-color 0.5s, color 0.5s;-ms-transition: border-color 0.5s, background-color 0.5s, color 0.5s; -o-transition: border-color 0.5s, background-color 0.5s, color 0.5s;transition: border-color 0.5s, background-color 0.5s, color 0.5s;}.spark-header.floater.above-the-fold .actions .button {border: 2px solid rgba(255,255,255,0.75);background-color: rgba(252,206,0,0);color: rgba(255,255,255,0.75);}.spark-header.floater.above-the-fold .actions .button:hover {border-color: rgba(255,255,255,1);color: rgba(255,255,255,1);}.spark-header-create-links {display: none;position: absolute;z-index: 20;top: 0;bottom: 0;left: 0;right: 0;background-color: rgba(0,0,0,0);}.spark-header-create-links.open {display: block;}.spark-header-create-links-content {position: absolute;background-color: rgba(36,44,51,1);top: 0;right: 29px;width: 150px;padding: 5px;border-radius: 0px 0px 14px 14px;box-shadow: 0px 0px 3px rgba(255,255,255,0.75);}.spark-header-create-links-content ul {list-style-type: none;padding-left: 15px;padding-right: 5px;margin: 6px 4px;}.spark-header-create-links-content h5 {font-family: adobe-clean, sans-serif;font-size: 15px;font-weight: 700;color: #FFFFFF;text-align: center;line-height: 1.5;padding: 10px 7px 5px 7px;}.spark-header-create-links-content a {display: block;width: 100%;text-decoration: none;font-family: adobe-clean, sans-serif;font-size: 15px;font-weight: 400;line-height: 1.5;color: #82919b;cursor: pointer;}.spark-header-create-links-content a:hover {color: #FFFFFF;}/***************/.sections-article-layout .spark-header-section {height: 40px;}.spark-header-section .spark-header {position: absolute;top: 0;right: 0;bottom: 0;left: 0;height: auto;background-color: white;}.spark-header-section .spark-header .branding,.spark-header-section .spark-header .actions,.spark-header-section .spark-header a.adobe-spark {line-height: 40px;}.spark-header-section .spark-header .branding {padding: 0 12px;}.spark-header-section .spark-header a.adobe-spark {padding-left: 32px;font-size: 14px;background-size: 25px 24px;}.spark-header-section .spark-header .actions {padding: 0 12px;font-size: 14px;}',"spark_header" : '<div class="spark-header floater show above-the-fold"><div class="branding"><a class="adobe-spark" href="https://spark.adobe.com/about?r=reader_page_logo">Adobe Spark</a></div><div class="actions"><a class="create-your-own button" href="https://spark.adobe.com/login?r=reader_page_topbar_createyourown" data-analytics-get-slate="">Create your own</a></div></div><div class="spark-header-create-links"><div class="spark-header-create-links-content"><h5>Create your own</h5><ul><li><a href="https://spark.adobe.com/templates/resumes/">Resumes</a><li><a href="https://spark.adobe.com/templates/invoices/">Invoices</a><li><a href="https://spark.adobe.com/templates/business-cards/">Business Cards</a><li><a href="https://spark.adobe.com/templates/banners/youtube-channel-art/">Youtube Banners</a><li><a href="https://spark.adobe.com/templates/brochures/">Brochures</a><li><a href="https://spark.adobe.com/templates/newsletters/">Newsletters</a><li><a href="https://spark.adobe.com/templates/invitations/">Invitations</a><li><a href="https://spark.adobe.com/templates/">See more</a></ul></div></div>',
    "done": "true"
  };
},{}],10:[function(require,module,exports){
/*!
 * mustache.js - Logic-less {{mustache}} templates with JavaScript
 * http://github.com/janl/mustache.js
 */

/*global define: false Mustache: true*/

(function defineMustache (global, factory) {
  if (typeof exports === 'object' && exports && typeof exports.nodeName !== 'string') {
    factory(exports); // CommonJS
  } else if (typeof define === 'function' && define.amd) {
    define(['exports'], factory); // AMD
  } else {
    global.Mustache = {};
    factory(global.Mustache); // script, wsh, asp
  }
}(this, function mustacheFactory (mustache) {

  var objectToString = Object.prototype.toString;
  var isArray = Array.isArray || function isArrayPolyfill (object) {
    return objectToString.call(object) === '[object Array]';
  };

  function isFunction (object) {
    return typeof object === 'function';
  }

  /**
   * More correct typeof string handling array
   * which normally returns typeof 'object'
   */
  function typeStr (obj) {
    return isArray(obj) ? 'array' : typeof obj;
  }

  function escapeRegExp (string) {
    return string.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, '\\$&');
  }

  /**
   * Null safe way of checking whether or not an object,
   * including its prototype, has a given property
   */
  function hasProperty (obj, propName) {
    return obj != null && typeof obj === 'object' && (propName in obj);
  }

  // Workaround for https://issues.apache.org/jira/browse/COUCHDB-577
  // See https://github.com/janl/mustache.js/issues/189
  var regExpTest = RegExp.prototype.test;
  function testRegExp (re, string) {
    return regExpTest.call(re, string);
  }

  var nonSpaceRe = /\S/;
  function isWhitespace (string) {
    return !testRegExp(nonSpaceRe, string);
  }

  var entityMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
  };

  function escapeHtml (string) {
    return String(string).replace(/[&<>"'`=\/]/g, function fromEntityMap (s) {
      return entityMap[s];
    });
  }

  var whiteRe = /\s*/;
  var spaceRe = /\s+/;
  var equalsRe = /\s*=/;
  var curlyRe = /\s*\}/;
  var tagRe = /#|\^|\/|>|\{|&|=|!/;

  /**
   * Breaks up the given `template` string into a tree of tokens. If the `tags`
   * argument is given here it must be an array with two string values: the
   * opening and closing tags used in the template (e.g. [ "<%", "%>" ]). Of
   * course, the default is to use mustaches (i.e. mustache.tags).
   *
   * A token is an array with at least 4 elements. The first element is the
   * mustache symbol that was used inside the tag, e.g. "#" or "&". If the tag
   * did not contain a symbol (i.e. {{myValue}}) this element is "name". For
   * all text that appears outside a symbol this element is "text".
   *
   * The second element of a token is its "value". For mustache tags this is
   * whatever else was inside the tag besides the opening symbol. For text tokens
   * this is the text itself.
   *
   * The third and fourth elements of the token are the start and end indices,
   * respectively, of the token in the original template.
   *
   * Tokens that are the root node of a subtree contain two more elements: 1) an
   * array of tokens in the subtree and 2) the index in the original template at
   * which the closing tag for that section begins.
   */
  function parseTemplate (template, tags) {
    if (!template)
      return [];

    var sections = [];     // Stack to hold section tokens
    var tokens = [];       // Buffer to hold the tokens
    var spaces = [];       // Indices of whitespace tokens on the current line
    var hasTag = false;    // Is there a {{tag}} on the current line?
    var nonSpace = false;  // Is there a non-space char on the current line?

    // Strips all whitespace tokens array for the current line
    // if there was a {{#tag}} on it and otherwise only space.
    function stripSpace () {
      if (hasTag && !nonSpace) {
        while (spaces.length)
          delete tokens[spaces.pop()];
      } else {
        spaces = [];
      }

      hasTag = false;
      nonSpace = false;
    }

    var openingTagRe, closingTagRe, closingCurlyRe;
    function compileTags (tagsToCompile) {
      if (typeof tagsToCompile === 'string')
        tagsToCompile = tagsToCompile.split(spaceRe, 2);

      if (!isArray(tagsToCompile) || tagsToCompile.length !== 2)
        throw new Error('Invalid tags: ' + tagsToCompile);

      openingTagRe = new RegExp(escapeRegExp(tagsToCompile[0]) + '\\s*');
      closingTagRe = new RegExp('\\s*' + escapeRegExp(tagsToCompile[1]));
      closingCurlyRe = new RegExp('\\s*' + escapeRegExp('}' + tagsToCompile[1]));
    }

    compileTags(tags || mustache.tags);

    var scanner = new Scanner(template);

    var start, type, value, chr, token, openSection;
    while (!scanner.eos()) {
      start = scanner.pos;

      // Match any text between tags.
      value = scanner.scanUntil(openingTagRe);

      if (value) {
        for (var i = 0, valueLength = value.length; i < valueLength; ++i) {
          chr = value.charAt(i);

          if (isWhitespace(chr)) {
            spaces.push(tokens.length);
          } else {
            nonSpace = true;
          }

          tokens.push([ 'text', chr, start, start + 1 ]);
          start += 1;

          // Check for whitespace on the current line.
          if (chr === '\n')
            stripSpace();
        }
      }

      // Match the opening tag.
      if (!scanner.scan(openingTagRe))
        break;

      hasTag = true;

      // Get the tag type.
      type = scanner.scan(tagRe) || 'name';
      scanner.scan(whiteRe);

      // Get the tag value.
      if (type === '=') {
        value = scanner.scanUntil(equalsRe);
        scanner.scan(equalsRe);
        scanner.scanUntil(closingTagRe);
      } else if (type === '{') {
        value = scanner.scanUntil(closingCurlyRe);
        scanner.scan(curlyRe);
        scanner.scanUntil(closingTagRe);
        type = '&';
      } else {
        value = scanner.scanUntil(closingTagRe);
      }

      // Match the closing tag.
      if (!scanner.scan(closingTagRe))
        throw new Error('Unclosed tag at ' + scanner.pos);

      token = [ type, value, start, scanner.pos ];
      tokens.push(token);

      if (type === '#' || type === '^') {
        sections.push(token);
      } else if (type === '/') {
        // Check section nesting.
        openSection = sections.pop();

        if (!openSection)
          throw new Error('Unopened section "' + value + '" at ' + start);

        if (openSection[1] !== value)
          throw new Error('Unclosed section "' + openSection[1] + '" at ' + start);
      } else if (type === 'name' || type === '{' || type === '&') {
        nonSpace = true;
      } else if (type === '=') {
        // Set the tags for the next time around.
        compileTags(value);
      }
    }

    // Make sure there are no open sections when we're done.
    openSection = sections.pop();

    if (openSection)
      throw new Error('Unclosed section "' + openSection[1] + '" at ' + scanner.pos);

    return nestTokens(squashTokens(tokens));
  }

  /**
   * Combines the values of consecutive text tokens in the given `tokens` array
   * to a single token.
   */
  function squashTokens (tokens) {
    var squashedTokens = [];

    var token, lastToken;
    for (var i = 0, numTokens = tokens.length; i < numTokens; ++i) {
      token = tokens[i];

      if (token) {
        if (token[0] === 'text' && lastToken && lastToken[0] === 'text') {
          lastToken[1] += token[1];
          lastToken[3] = token[3];
        } else {
          squashedTokens.push(token);
          lastToken = token;
        }
      }
    }

    return squashedTokens;
  }

  /**
   * Forms the given array of `tokens` into a nested tree structure where
   * tokens that represent a section have two additional items: 1) an array of
   * all tokens that appear in that section and 2) the index in the original
   * template that represents the end of that section.
   */
  function nestTokens (tokens) {
    var nestedTokens = [];
    var collector = nestedTokens;
    var sections = [];

    var token, section;
    for (var i = 0, numTokens = tokens.length; i < numTokens; ++i) {
      token = tokens[i];

      switch (token[0]) {
        case '#':
        case '^':
          collector.push(token);
          sections.push(token);
          collector = token[4] = [];
          break;
        case '/':
          section = sections.pop();
          section[5] = token[2];
          collector = sections.length > 0 ? sections[sections.length - 1][4] : nestedTokens;
          break;
        default:
          collector.push(token);
      }
    }

    return nestedTokens;
  }

  /**
   * A simple string scanner that is used by the template parser to find
   * tokens in template strings.
   */
  function Scanner (string) {
    this.string = string;
    this.tail = string;
    this.pos = 0;
  }

  /**
   * Returns `true` if the tail is empty (end of string).
   */
  Scanner.prototype.eos = function eos () {
    return this.tail === '';
  };

  /**
   * Tries to match the given regular expression at the current position.
   * Returns the matched text if it can match, the empty string otherwise.
   */
  Scanner.prototype.scan = function scan (re) {
    var match = this.tail.match(re);

    if (!match || match.index !== 0)
      return '';

    var string = match[0];

    this.tail = this.tail.substring(string.length);
    this.pos += string.length;

    return string;
  };

  /**
   * Skips all text until the given regular expression can be matched. Returns
   * the skipped string, which is the entire tail if no match can be made.
   */
  Scanner.prototype.scanUntil = function scanUntil (re) {
    var index = this.tail.search(re), match;

    switch (index) {
      case -1:
        match = this.tail;
        this.tail = '';
        break;
      case 0:
        match = '';
        break;
      default:
        match = this.tail.substring(0, index);
        this.tail = this.tail.substring(index);
    }

    this.pos += match.length;

    return match;
  };

  /**
   * Represents a rendering context by wrapping a view object and
   * maintaining a reference to the parent context.
   */
  function Context (view, parentContext) {
    this.view = view;
    this.cache = { '.': this.view };
    this.parent = parentContext;
  }

  /**
   * Creates a new context using the given view with this context
   * as the parent.
   */
  Context.prototype.push = function push (view) {
    return new Context(view, this);
  };

  /**
   * Returns the value of the given name in this context, traversing
   * up the context hierarchy if the value is absent in this context's view.
   */
  Context.prototype.lookup = function lookup (name) {
    var cache = this.cache;

    var value;
    if (cache.hasOwnProperty(name)) {
      value = cache[name];
    } else {
      var context = this, names, index, lookupHit = false;

      while (context) {
        if (name.indexOf('.') > 0) {
          value = context.view;
          names = name.split('.');
          index = 0;

          /**
           * Using the dot notion path in `name`, we descend through the
           * nested objects.
           *
           * To be certain that the lookup has been successful, we have to
           * check if the last object in the path actually has the property
           * we are looking for. We store the result in `lookupHit`.
           *
           * This is specially necessary for when the value has been set to
           * `undefined` and we want to avoid looking up parent contexts.
           **/
          while (value != null && index < names.length) {
            if (index === names.length - 1)
              lookupHit = hasProperty(value, names[index]);

            value = value[names[index++]];
          }
        } else {
          value = context.view[name];
          lookupHit = hasProperty(context.view, name);
        }

        if (lookupHit)
          break;

        context = context.parent;
      }

      cache[name] = value;
    }

    if (isFunction(value))
      value = value.call(this.view);

    return value;
  };

  /**
   * A Writer knows how to take a stream of tokens and render them to a
   * string, given a context. It also maintains a cache of templates to
   * avoid the need to parse the same template twice.
   */
  function Writer () {
    this.cache = {};
  }

  /**
   * Clears all cached templates in this writer.
   */
  Writer.prototype.clearCache = function clearCache () {
    this.cache = {};
  };

  /**
   * Parses and caches the given `template` and returns the array of tokens
   * that is generated from the parse.
   */
  Writer.prototype.parse = function parse (template, tags) {
    var cache = this.cache;
    var tokens = cache[template];

    if (tokens == null)
      tokens = cache[template] = parseTemplate(template, tags);

    return tokens;
  };

  /**
   * High-level method that is used to render the given `template` with
   * the given `view`.
   *
   * The optional `partials` argument may be an object that contains the
   * names and templates of partials that are used in the template. It may
   * also be a function that is used to load partial templates on the fly
   * that takes a single argument: the name of the partial.
   */
  Writer.prototype.render = function render (template, view, partials) {
    var tokens = this.parse(template);
    var context = (view instanceof Context) ? view : new Context(view);
    return this.renderTokens(tokens, context, partials, template);
  };

  /**
   * Low-level method that renders the given array of `tokens` using
   * the given `context` and `partials`.
   *
   * Note: The `originalTemplate` is only ever used to extract the portion
   * of the original template that was contained in a higher-order section.
   * If the template doesn't use higher-order sections, this argument may
   * be omitted.
   */
  Writer.prototype.renderTokens = function renderTokens (tokens, context, partials, originalTemplate) {
    var buffer = '';

    var token, symbol, value;
    for (var i = 0, numTokens = tokens.length; i < numTokens; ++i) {
      value = undefined;
      token = tokens[i];
      symbol = token[0];

      if (symbol === '#') value = this.renderSection(token, context, partials, originalTemplate);
      else if (symbol === '^') value = this.renderInverted(token, context, partials, originalTemplate);
      else if (symbol === '>') value = this.renderPartial(token, context, partials, originalTemplate);
      else if (symbol === '&') value = this.unescapedValue(token, context);
      else if (symbol === 'name') value = this.escapedValue(token, context);
      else if (symbol === 'text') value = this.rawValue(token);

      if (value !== undefined)
        buffer += value;
    }

    return buffer;
  };

  Writer.prototype.renderSection = function renderSection (token, context, partials, originalTemplate) {
    var self = this;
    var buffer = '';
    var value = context.lookup(token[1]);

    // This function is used to render an arbitrary template
    // in the current context by higher-order sections.
    function subRender (template) {
      return self.render(template, context, partials);
    }

    if (!value) return;

    if (isArray(value)) {
      for (var j = 0, valueLength = value.length; j < valueLength; ++j) {
        buffer += this.renderTokens(token[4], context.push(value[j]), partials, originalTemplate);
      }
    } else if (typeof value === 'object' || typeof value === 'string' || typeof value === 'number') {
      buffer += this.renderTokens(token[4], context.push(value), partials, originalTemplate);
    } else if (isFunction(value)) {
      if (typeof originalTemplate !== 'string')
        throw new Error('Cannot use higher-order sections without the original template');

      // Extract the portion of the original template that the section contains.
      value = value.call(context.view, originalTemplate.slice(token[3], token[5]), subRender);

      if (value != null)
        buffer += value;
    } else {
      buffer += this.renderTokens(token[4], context, partials, originalTemplate);
    }
    return buffer;
  };

  Writer.prototype.renderInverted = function renderInverted (token, context, partials, originalTemplate) {
    var value = context.lookup(token[1]);

    // Use JavaScript's definition of falsy. Include empty arrays.
    // See https://github.com/janl/mustache.js/issues/186
    if (!value || (isArray(value) && value.length === 0))
      return this.renderTokens(token[4], context, partials, originalTemplate);
  };

  Writer.prototype.renderPartial = function renderPartial (token, context, partials) {
    if (!partials) return;

    var value = isFunction(partials) ? partials(token[1]) : partials[token[1]];
    if (value != null)
      return this.renderTokens(this.parse(value), context, partials, value);
  };

  Writer.prototype.unescapedValue = function unescapedValue (token, context) {
    var value = context.lookup(token[1]);
    if (value != null)
      return value;
  };

  Writer.prototype.escapedValue = function escapedValue (token, context) {
    var value = context.lookup(token[1]);
    if (value != null)
      return mustache.escape(value);
  };

  Writer.prototype.rawValue = function rawValue (token) {
    return token[1];
  };

  mustache.name = 'mustache.js';
  mustache.version = '2.3.2';
  mustache.tags = [ '{{', '}}' ];

  // All high-level mustache.* functions use this writer.
  var defaultWriter = new Writer();

  /**
   * Clears all cached templates in the default writer.
   */
  mustache.clearCache = function clearCache () {
    return defaultWriter.clearCache();
  };

  /**
   * Parses and caches the given template in the default writer and returns the
   * array of tokens it contains. Doing this ahead of time avoids the need to
   * parse templates on the fly as they are rendered.
   */
  mustache.parse = function parse (template, tags) {
    return defaultWriter.parse(template, tags);
  };

  /**
   * Renders the `template` with the given `view` and `partials` using the
   * default writer.
   */
  mustache.render = function render (template, view, partials) {
    if (typeof template !== 'string') {
      throw new TypeError('Invalid template! Template should be a "string" ' +
                          'but "' + typeStr(template) + '" was given as the first ' +
                          'argument for mustache#render(template, view, partials)');
    }

    return defaultWriter.render(template, view, partials);
  };

  // This is here for backwards compatibility with 0.4.x.,
  /*eslint-disable */ // eslint wants camel cased function name
  mustache.to_html = function to_html (template, view, partials, send) {
    /*eslint-enable*/

    var result = mustache.render(template, view, partials);

    if (isFunction(send)) {
      send(result);
    } else {
      return result;
    }
  };

  // Export the escaping function so that the user may override it.
  // See https://github.com/janl/mustache.js/issues/244
  mustache.escape = escapeHtml;

  // Export these mainly for testing, but also for advanced usage.
  mustache.Scanner = Scanner;
  mustache.Context = Context;
  mustache.Writer = Writer;

  return mustache;
}));

},{}]},{},[2]);

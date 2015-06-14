/**
 * Created by salam on 6/5/2015.
 */
angular.module('starter').controller("HomeCtrl", function($scope, $cordovaOauth, $q,$ionicLoading) {
    console.log('In Home Controller');
    $scope.loginResult = "";

    $scope.login = function() {
        $scope.identityServerLogin("ota1", ["ota1"]).then(function(result) {
            console.log(JSON.stringify(result));
            $scope.loginResult = JSON.stringify(result);
        }, function(error) {
            console.log(error);
            $scope.loginResult = JSON.stringify(error);
        });
    };

    $scope.identityServer2= function(){

        var getToken = function (url, data, header) {
            $http.defaults.headers.common.Authorization = header;
            return $http.post(url, data);
        };

        if($location.absUrl().split('?')[1]) {
            $scope.params = getParamsFromUrl($location.absUrl());

            var tokenEndpoint = 'https://localhost:44333/connect/token';
            var client_id = 'codeclient';
            var client_secret = 'secret';
            var str = client_id + ':' + client_secret;

            var baseEncoded = $base64.encode(str);


            var tokenData = {};
            tokenData.grant_type = 'authorization_code';
            tokenData.code = $scope.params.code;
            tokenData.redirect_uri = 'http://localhost:8000/login.html';


            var reqHeader = 'Basic ' + baseEncoded;

            getToken(tokenEndpoint, tokenData, reqHeader)
                .success(function (data, status, headers, config) {
                    console.log(data);
                    console.log(status);
                    console.log(headers);
                    console.log(config);
                }).error(function (data, status, headers, config) {
                    console.log(data);
                    console.log(status);
                    console.log(headers);
                    console.log(config);
                });
        }
    };


    /*
     * Sign into the IdentityServer service
     *
     * @param    string clientId
     * @param    array appScope
     * @param    object options
     * @return   promise
     */
    $scope.identityServerLogin = function(clientId, appScope, options) {
        var deferred = $q.defer();
        if(window.cordova) {
            var cordovaMetadata = cordova.require("cordova/plugin_list").metadata;
            if(cordovaMetadata.hasOwnProperty("cordova-plugin-inappbrowser") === true || cordovaMetadata.hasOwnProperty("org.apache.cordova.inappbrowser") === true) {
                var redirect_uri = "http://localhost/callback";
                if(options !== undefined) {
                    if(options.hasOwnProperty("redirect_uri")) {
                        redirect_uri = options.redirect_uri;
                    }
                }
                //var authorizationUrl = 'https://192.168.137.1:44333/core/connect/authorize';

                var authorizationUrl = 'https://172.25.109.34/identity/connect/authorize';

                //var authorizationUrl = 'https://CHWNDEVISAPP1.mesirow.net/identity/connect/authorize';

                var client_id = 'ota1';
                var response_type = "token";
                var scope = "ota1";
                var state = Date.now() + "" + Math.random();

                localStorage["state"] = state;

                var url =
                    authorizationUrl + "?" +
                    "client_id=" + encodeURI(client_id) + "&" +
                    "redirect_uri=" + encodeURI(redirect_uri) + "&" +
                    "response_type=" + encodeURI(response_type) + "&" +
                    "scope=" + encodeURI(scope) + "&" +
                    "state=" + encodeURI(state);
                //window.location = url;

                var browserRef = window.open(url, '_blank', 'location=no,clearsessioncache=yes,clearcache=yes,validatessl=no');

                browserRef.onSSLError = function(url) {
                    //return !!/^https://192.168.1.101\//.exec(url);
                    console.log('ssl error?');
                };

                browserRef.addEventListener("loaderror", function(event){
                    console.log("loaderror");

                });
               // browserRef.addEventListener("loadstop", function(event){
                //    $ionicLoading.hide();
                 //   console.log("loadstop");
                 //   browserRef.show();

                //});
                browserRef.addEventListener("loadstart", function(event) {
                    console.log('in loadstart event');
                    console.log(event.url);
                   // $ionicLoading.show({
                        //template: 'Authenticating...'
                      //  content: 'Authenticating...',
                      //  animation: 'fade-in',
                      //  showBackdrop: false,
                     //   maxWidth: 200,
                     //   showDelay: 500
                   // });
                    if((event.url).indexOf(redirect_uri) === 0) {
                        console.log('redirect matches');
                        browserRef.removeEventListener("exit",function(event){});
                        browserRef.close();

                        var access_token = processTokenCallback(event.url);

                        var callbackResponse = (event.url).split("#")[1];
                        var responseParameters = (callbackResponse).split("&");
                        var parameterMap = [];
                        for(var i = 0; i < responseParameters.length; i++) {
                            parameterMap[responseParameters[i].split("=")[0]] = responseParameters[i].split("=")[1];
                        }
                        if(parameterMap.access_token !== undefined && parameterMap.access_token !== null) {
                            deferred.resolve({ access_token: parameterMap.access_token, token_type: parameterMap.token_type, expires_in: parameterMap.expires_in });
                        } else {
                            deferred.reject("Problem authenticating");
                        }
                    }
                });
                browserRef.addEventListener('exit', function(event) {
                    deferred.reject("The sign in flow was canceled");
                });
            } else {
                deferred.reject("Could not find InAppBrowser plugin");
            }
        } else {
            deferred.reject("Cannot authenticate via a web browser");
        }
        return deferred.promise;
    };

    function processTokenCallback(url) {
        var hash = url.substr(1);
        var result = hash.split('&').reduce(function (result, item) {
            var parts = item.split('=');
            result[parts[0]] = parts[1];
            return result;
        }, {});

        //show(result);

        if (!result.error) {
            if (result.state !== localStorage["state"]) {
                show("invalid state");
            }
            else {
                localStorage.removeItem("state");
                return result.access_token;
            }
        }
    }

});

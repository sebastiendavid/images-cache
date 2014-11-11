'use strict';
var _ = require('lodash');
var angular = require('angular');
var moment = require('moment');
var app;

app = angular.module('imagesCache', [
    'ngAnimate',
    'ngCookies',
    'ngResource',
    'ngRoute',
    'ngSanitize'
]);

app.factory('utils', [
    '$window',
    function ($window) {
        return {
            hasLocalStorage: function () {
                var ls = $window.localStorage;
                return ls && _.isFunction(ls.getItem) && _.isFunction(ls.setItem);
            }
        };
    }
]);

app.controller('imagesCtrl', [
    '$scope',
    '$resource',
    '$window',
    '$log',
    'utils',
    function ($scope, $resource, $window, $log, utils) {
        var hasLocalStorage = utils.hasLocalStorage();
        var localStorage = $window.localStorage;
        var cacheLifetime = 1;
        var cache;

        $log.info('local storage: ' + hasLocalStorage);
        $scope.images = [];

        if (hasLocalStorage) {
            try {
                cache = JSON.parse(localStorage.getItem('imagesCache'));
                cache.images = JSON.parse(cache.images);
            } catch (e) {
                $log.warn('unable to parse imagesCache');
            }
        }

        function isOutdated(dateStr) {
            var now = moment();
            var date = moment(dateStr);
            var diff = now.diff(date, 'minutes', true);
            var outdated = !date.isValid() || (diff < 0 ? diff * -1 : diff) > cacheLifetime;
            if (outdated) {
                $log.warn('cache is outdated');
            }
            return outdated;
        }

        if (cache && _.isArray(cache.images) && !_.isEmpty(cache.images) && !isOutdated(cache.lastUpdate)) {
            $log.info('load images from cache');
            _.each(cache.images, function (image) {
                $scope.images.push(image);
            });
        } else {
            $log.info('load images from server');
            $resource('/images?items=50').query()
                .$promise
                .then(function (arr) {
                    _.each(arr, function (image) {
                        $scope.images.push(image);
                    });

                    if (hasLocalStorage) {
                        localStorage.setItem('imagesCache', JSON.stringify({
                            images: JSON.stringify($scope.images),
                            lastUpdate: moment().format()
                        }));
                    }
                }, function (err) {
                    $log.error(err);
                });
        }

        $scope.invalidateCache = function () {
            if (utils.hasLocalStorage()) {
                localStorage.setItem('imagesCache', null);
            }
        };
    }
]);

angular.bootstrap(document.body, ['imagesCache']);
module.exports = app;

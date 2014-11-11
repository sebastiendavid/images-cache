'use strict';
module.exports = function (app) {
    var _ = require('lodash');
    var moment = require('moment');

    app.get('/images', function (req, res) {
        var images = [];
        var theme = ['abstract', 'animals', 'business', 'cats', 'city', 'food', 'nightlife', 'fashion',
            'people', 'nature', 'sports', 'technics', 'transport'
        ];
        var items = _.parseInt(req.query.items || 10);

        _.times(items, function (i) {
            var t = theme[_.random(0, 12)];
            var n = _.random(1, 10);
            var w = 800;
            var h = 600;

            images.push({
                'imageId': i,
                'name': 'foobar' + i + '.jpg',
                'description': 'This is foobar' + i,
                'url': 'http://lorempixel.com/' + w + '/' + h + '/' + t + '/' + n,
                'urlThumb': 'http://lorempixel.com/100/100/' + t + '/' + n,
                'size': _.random(1000, 500000),
                'width': w,
                'height': h,
                'dateCreation': moment().subtract(2, 'months').format(),
                'dateModification': moment().subtract(7, 'days').format(),
                'dateLastUse': moment().subtract(1, 'day').format(),
                'managerId': 2000,
                'managerName': 'Foo Bar'
            });
        });

        res.set('Content-Type', 'application/json; charset=utf-8');

        _.delay(function () {
            res.status(200).send(images);
        }, 500);
    });
};

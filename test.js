var dotest = require ('dotest');
var app = require ('./');

var ns;
var config = {
  username: process.env.NS_USERNAME || null,
  password: process.env.NS_PASSWORD || null,
  timeout: process.env.NS_TIMEOUT || 5000
};


ns = app (config);


// Basic tests
dotest.add ('Module', function (test) {
  test ()
    .isFunction ('fail', 'exports', app)
    .isObject ('fail', 'interface', ns)
    .isFunction ('fail', '.vertrektijden method', ns && ns.vertrektijden)
    .isFunction ('fail', '.reisadvies method', ns && ns.reisadvies)
    .isFunction ('fail', '.prijzen method', ns && ns.prijzen)
    .isFunction ('fail', '.stations method', ns && ns.stations)
    .isFunction ('fail', '.storingen method', ns && ns.storingen)
    .done ();
});


dotest.add ('API error', function (test) {
  ns.reisadvies (function (err, data) {
    test ()
      .isError ('fail', 'err', err)
      .isExactly ('fail', 'err.message', err && err.message, 'API error')
      .isObject ('fail', 'err.api', err && err.api)
      .isString ('fail', 'err.api.message', err && err.api && err.api.message)
      .isUndefined ('fail', 'data', data)
      .done ();
  });
});


dotest.add ('Method .reisadvies', function (test) {
  var params = {
    fromStation: 'Amersfoort',
    toStation: 'Amsterdam'
  };

  ns.reisadvies (params, function (err, data) {
    test (err)
      .isArray ('fail', 'data', data)
      .isNotEmpty ('fail', 'data', data)
      .isObject ('fail', 'data[0]', data && data [0])
      .isArray ('fail', 'data[0].ReisDeel', data && data [0] && data [0] .ReisDeel)
      .isNotEmpty ('fail', 'data[0].ReisDeel', data && data [0] && data [0] .ReisDeel)
      .done ();
  });
});


dotest.add ('Method .storingen - with params', function (test) {
  ns.storingen ({ actual: true }, function (err, data) {
    test (err)
      .isObject ('fail', 'data', data)
      .isArray ('fail', 'data.Ongepland', data && data.Ongepland)
      .isArray ('fail', 'data.Gepland', data && data.Gepland)
      .done ();
  });
});


dotest.add ('Method .storingen - without params', function (test) {
  ns.storingen (function (err, data) {
    test (err)
      .isObject ('fail', 'data', data)
      .isArray ('fail', 'data.Ongepland', data && data.Ongepland)
      .isArray ('fail', 'data.Gepland', data && data.Gepland)
      .done ();
  });
});


dotest.add ('Method .stations - no key', function (test) {
  ns.stations (function (err, data) {
    test (err)
      .isObject ('fail', 'data', data)
      .isObject ('fail', 'data.HT', data && data.HT)
      .isExactly ('fail', 'data.HT.Code', data && data.HT && data.HT.Code, 'HT')
      .isArray ('fail', 'data.HT.Synoniemen', data && data.HT && data.HT.Synoniemen)
      .done ();
  });
});


dotest.add ('Method .stations - array', function (test) {
  ns.stations (false, function (err, data) {
    test (err)
      .isArray ('fail', 'data', data)
      .isNotEmpty ('fail', 'data', data)
      .isObject ('fail', 'data[0]', data && data [0])
      .isString ('fail', 'data[0].Code', data && data [0] && data [0] .Code)
      .isArray ('fail', 'data[0].Synoniemen', data && data [0] && data [0] .Synoniemen)
      .done ();
  });
});


dotest.add ('Method .stations - by Type', function (test) {
  ns.stations ('Type', function (err, data) {
    test (err)
      .isObject ('fail', 'data', data)
      .isNotEmpty ('fail', 'data', data)
      .isObject ('fail', 'data.megastation', data && data.megastation)
      .isObject ('fail', 'data.megastation.ASD', data && data.megastation.ASD)
      .isExactly ('fail', 'data.megastation.ASD.Land', data && data.megastation && data.megastation.ASD && data.megastation.ASD.Land, 'NL')
      .isArray ('fail', 'data.megastation.ASD.Synoniemen', data && data.megastation && data.megastation.ASD && data.megastation.ASD.Synoniemen)
      .done ();
  });
});


dotest.add ('Method .vertrektijden', function (test) {
  ns.vertrektijden ('UT', function (err, data) {
    test (err)
      .isArray ('fail', 'data', data)
      .isNotEmpty ('fail', 'data', data)
      .isObject ('fail', 'data[0]', data && data [0])
      .isString ('fail', 'data[0].RitNummer', data && data [0] && data [0] .RitNummer)
      .isBoolean ('fail', 'data[0].VertrekSpoorWijziging', data && data [0] && data [0] .VertrekSpoorWijziging)
      .done ();
  });
});


dotest.add ('Method .vertrektijden - error', function (test) {
  ns.vertrektijden ('test', function (err, data) {
    test ()
      .isError ('fail', 'err', err)
      .isExactly ('fail', 'err.message', err && err.message, 'API error')
      .isObject ('fail', 'err.api', err && err.api)
      .isString ('fail', 'err.api.message', err && err.api && err.api.message)
      .isUndefined ('fail', 'data', data)
      .done ();
  });
});


dotest.add ('Method .prijzen', function (test) {
  ns.prijzen (function (err, data) {
    test ()
      .warn ('No test available yet')
      .isError ('fail', 'err', err)
      .isUndefined ('fail', 'data', data)
      .done ();
  });
});


dotest.add ('Config .timeout', function (test) {
  var tmp = app ({
    username: config.username,
    password: config.password,
    timeout: 1
  });

  tmp.stations (function (err, data) {
    test ()
      .isError ('fail', 'err', err)
      .isUndefined ('fail', 'data', data)
      .done ();
  });
});


dotest.run ();

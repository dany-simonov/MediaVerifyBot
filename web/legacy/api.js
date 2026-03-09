/* api.js — API client for Источник web platform */
(function () {
  'use strict';

  var config = window.ISTOCHNIK_CONFIG || {};
  var API_BASE = config.apiBase || '';
  var API_SECRET = config.apiSecret || '';

  /**
   * Make an authenticated API request.
   */
  function apiRequest(method, path, options) {
    options = options || {};
    var url = API_BASE + path;
    var fetchOptions = {
      method: method,
      headers: Object.assign({ 'x-api-secret': API_SECRET }, options.headers || {}),
    };
    if (options.body) {
      fetchOptions.body = options.body;
    }
    return fetch(url, fetchOptions).then(function (res) {
      if (!res.ok) throw new Error('API error: ' + res.status);
      return res;
    });
  }

  /**
   * GET /user/:uid/stats
   */
  function getUserStats(userId) {
    return apiRequest('GET', '/user/' + userId + '/stats').then(function (r) { return r.json(); });
  }

  /**
   * GET /user/:uid/checks
   */
  function getUserChecks(userId, params) {
    params = params || {};
    var qs = '?limit=' + (params.limit || 50) + '&offset=' + (params.offset || 0);
    if (params.media_type) qs += '&media_type=' + params.media_type;
    if (params.verdict) qs += '&verdict=' + params.verdict;
    return apiRequest('GET', '/user/' + userId + '/checks' + qs).then(function (r) { return r.json(); });
  }

  /**
   * POST /bigcheck — multipart form data
   */
  function postBigCheck(files, textContent, userId) {
    var formData = new FormData();
    for (var i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }
    if (textContent) {
      formData.append('text_content', textContent);
    }
    formData.append('user_id', String(userId || 0));
    return apiRequest('POST', '/bigcheck', { body: formData }).then(function (r) { return r.json(); });
  }

  /**
   * Download PDF report
   */
  function downloadReport(userId, checkId) {
    return apiRequest('GET', '/user/' + userId + '/checks/' + checkId + '/report')
      .then(function (res) { return res.blob(); })
      .then(function (blob) {
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'istochnik-report-' + checkId + '.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      });
  }

  // Expose globally
  window.IstochnikAPI = {
    getUserStats: getUserStats,
    getUserChecks: getUserChecks,
    postBigCheck: postBigCheck,
    downloadReport: downloadReport,
  };
})();

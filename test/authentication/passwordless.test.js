import expect from 'expect.js';
import sinon from 'sinon';

import RequestMock from '../mock/request-mock';

import request from 'superagent';

import Authentication from '../../src/authentication';

describe('auth0.authentication', function() {
  context('passwordless start options', function() {
    before(function() {
      this.auth0 = new Authentication({
        domain: 'me.auth0.com',
        clientID: '...',
        redirectUri: 'http://page.com/callback',
        responseType: 'code',
        _sendTelemetry: false
      });
    });

    it('should check that options is passed', function() {
      var _this = this;
      expect(function() {
        _this.auth0.passwordless.start();
      }).to.throwException(function(e) {
        expect(e.message).to.be('options parameter is not valid');
      });
    });

    it('should check that options.connection is passed', function() {
      var _this = this;
      expect(function() {
        _this.auth0.passwordless.start({});
      }).to.throwException(function(e) {
        expect(e.message).to.be('connection option is required');
      });
    });

    it('should check that options.send is passed', function() {
      var _this = this;
      expect(function() {
        _this.auth0.passwordless.start({ connection: 'bla' });
      }).to.throwException(function(e) {
        expect(e.message).to.be('send option is required');
      });
    });

    it('should check that options.send is valid', function() {
      var _this = this;
      expect(function() {
        _this.auth0.passwordless.start({ connection: 'bla', send: 'blabla' });
      }).to.throwException(function(e) {
        expect(e.message).to.be('send is not valid ([link, code])');
      });
    });

    it('should check that cb is valid', function() {
      var _this = this;
      expect(function() {
        _this.auth0.passwordless.start({
          connection: 'bla',
          send: 'code',
          email: 'me@example.com'
        });
      }).to.throwException(function(e) {
        expect(e.message).to.be('cb parameter is not valid');
      });
    });
  });

  context('passwordless verify options', function() {
    before(function() {
      this.auth0 = new Authentication({
        domain: 'me.auth0.com',
        clientID: '...',
        redirectUri: 'http://page.com/callback',
        responseType: 'code',
        _sendTelemetry: false
      });
    });

    it('should check that options is passed', function() {
      var _this = this;
      expect(function() {
        _this.auth0.passwordless.verify();
      }).to.throwException(function(e) {
        expect(e.message).to.be('options parameter is not valid');
      });
    });

    it('should check that options.connection is passed', function() {
      var _this = this;
      expect(function() {
        _this.auth0.passwordless.verify({});
      }).to.throwException(function(e) {
        expect(e.message).to.be('connection option is required');
      });
    });

    it('should check that options.type is passed', function() {
      var _this = this;
      expect(function() {
        _this.auth0.passwordless.verify({ connection: 'bla' });
      }).to.throwException(function(e) {
        expect(e.message).to.be('verificationCode option is required');
      });
    });

    it('should check that options.verificationCode is passed', function() {
      var _this = this;
      expect(function() {
        _this.auth0.passwordless.verify({ connection: 'bla', send: 'code' });
      }).to.throwException(function(e) {
        expect(e.message).to.be('verificationCode option is required');
      });
    });

    it('should check that options.type is valid', function() {
      var _this = this;
      expect(function() {
        _this.auth0.passwordless.verify({
          connection: 'bla',
          verificationCode: 'asdfasd'
        });
      }).to.throwException(function(e) {
        expect(e.message).to.be('phoneNumber option is required');
      });
    });

    it('should check that cb is valid', function() {
      var _this = this;
      expect(function() {
        _this.auth0.passwordless.verify({
          connection: 'bla',
          send: 'link',
          verificationCode: 'asdfasd',
          email: 'me@example.com'
        });
      }).to.throwException(function(e) {
        expect(e.message).to.be('cb parameter is not valid');
      });
    });

    it('should check that email is sent', function() {
      var _this = this;
      expect(function() {
        _this.auth0.passwordless.verify(
          { connection: 'bla', send: 'code', verificationCode: 'asdfasd' },
          function() {}
        );
      }).to.throwException(function(e) {
        expect(e.message).to.be('phoneNumber option is required');
      });
    });

    it('should check that phoneNumber is sent', function() {
      var _this = this;
      expect(function() {
        _this.auth0.passwordless.verify(
          { connection: 'bla', send: 'code', verificationCode: 'asdfasd' },
          function() {}
        );
      }).to.throwException(function(e) {
        expect(e.message).to.be('phoneNumber option is required');
      });
    });
  });

  context('passwordless start', function() {
    before(function() {
      this.auth0 = new Authentication({
        domain: 'me.auth0.com',
        clientID: '...',
        redirectUri: 'http://page.com/callback',
        responseType: 'code',
        _sendTelemetry: false,
        scope: ''
      });
    });

    afterEach(function() {
      request.post.restore();
    });

    it('should call passwordless start', function(done) {
      sinon.stub(request, 'post').callsFake(function(url) {
        expect(url).to.be('https://me.auth0.com/passwordless/start');
        return new RequestMock({
          body: {
            client_id: '...',
            connection: 'the_connection',
            email: 'me@example.com',
            send: 'link',
            authParams: {
              redirect_uri: 'http://page.com/callback',
              response_type: 'code'
            }
          },
          headers: {
            'Content-Type': 'application/json'
          },
          cb: function(cb) {
            cb(null, {
              body: {}
            });
          }
        });
      });

      this.auth0.passwordless.start(
        {
          connection: 'the_connection',
          email: 'me@example.com',
          send: 'link'
        },
        function(err, data) {
          expect(err).to.be(null);
          expect(data).to.eql({});
          done();
        }
      );
    });

    it('should call passwordless start with authParams', function(done) {
      var auth0 = new Authentication({
        domain: 'me.auth0.com',
        clientID: '...',
        redirectUri: 'will be overridden',
        responseType: 'code',
        _sendTelemetry: false,
        scope: 'will be overridden'
      });

      sinon.stub(request, 'post').callsFake(function(url) {
        expect(url).to.be('https://me.auth0.com/passwordless/start');
        return new RequestMock({
          body: {
            client_id: '...',
            connection: 'the_connection',
            email: 'me@example.com',
            send: 'code',
            authParams: {
              scope: 'openid email',
              redirect_uri: 'http://page.com/othercallback',
              response_type: 'token',
              protocol: 'wsfed'
            }
          },
          headers: {
            'Content-Type': 'application/json'
          },
          cb: function(cb) {
            cb(null, {
              body: {}
            });
          }
        });
      });

      auth0.passwordless.start(
        {
          connection: 'the_connection',
          email: 'me@example.com',
          send: 'code',
          authParams: {
            redirectUri: 'http://page.com/othercallback',
            protocol: 'wsfed',
            responseType: 'token',
            scope: 'openid email'
          }
        },
        function(err, data) {
          expect(err).to.be(null);
          expect(data).to.eql({});
          done();
        }
      );
    });

    it('should call passwordless start with X-Request-Language header set', function(done) {
      var auth0 = new Authentication({
        domain: 'me.auth0.com',
        clientID: '...',
        redirectUri: 'will be overridden',
        responseType: 'code',
        _sendTelemetry: false,
        scope: 'will be overridden'
      });

      sinon.stub(request, 'post').callsFake(function(url) {
        expect(url).to.be('https://me.auth0.com/passwordless/start');
        return new RequestMock({
          body: {
            client_id: '...',
            connection: 'the_connection',
            email: 'me@example.com',
            send: 'code',
            authParams: {
              scope: 'openid email',
              redirect_uri: 'http://page.com/othercallback',
              response_type: 'token',
              protocol: 'wsfed'
            }
          },
          headers: {
            'Content-Type': 'application/json',
            'X-Request-Language': 'de-DE'
          },
          cb: function(cb) {
            cb(null, {
              body: {}
            });
          }
        });
      });

      auth0.passwordless.start(
        {
          connection: 'the_connection',
          email: 'me@example.com',
          send: 'code',
          authParams: {
            redirectUri: 'http://page.com/othercallback',
            protocol: 'wsfed',
            responseType: 'token',
            scope: 'openid email'
          },
          xRequestLanguage: 'de-DE'
        },
        function(err, data) {
          expect(err).to.be(null);
          expect(data).to.eql({});
          done();
        }
      );
    });
  });

  context('passwordless verify', function() {
    before(function() {
      this.auth0 = new Authentication({
        domain: 'me.auth0.com',
        clientID: '...',
        redirectUri: 'http://page.com/callback',
        responseType: 'code',
        _sendTelemetry: false
      });
    });

    afterEach(function() {
      request.post.restore();
    });

    it('should call passwordless verify sms with all the options', function(done) {
      sinon.stub(request, 'post').callsFake(function(url) {
        expect(url).to.be('https://me.auth0.com/passwordless/verify');
        return new RequestMock({
          body: {
            connection: 'the_connection',
            phone_number: '123456',
            verification_code: 'abc'
          },
          headers: {
            'Content-Type': 'application/json'
          },
          cb: function(cb) {
            cb(null, {
              body: {}
            });
          }
        });
      });

      this.auth0.passwordless.verify(
        {
          connection: 'the_connection',
          phoneNumber: '123456',
          verificationCode: 'abc'
        },
        function(err, data) {
          expect(err).to.be(null);
          expect(data).to.eql({});
          done();
        }
      );
    });

    it('should call passwordless verify email with all the options', function(done) {
      sinon.stub(request, 'post').callsFake(function(url) {
        expect(url).to.be('https://me.auth0.com/passwordless/verify');
        return new RequestMock({
          body: {
            connection: 'the_connection',
            email: 'me@example.com',
            verification_code: 'abc'
          },
          headers: {
            'Content-Type': 'application/json'
          },
          cb: function(cb) {
            cb(null, {
              body: {}
            });
          }
        });
      });

      this.auth0.passwordless.verify(
        {
          connection: 'the_connection',
          email: 'me@example.com',
          verificationCode: 'abc'
        },
        function(err, data) {
          expect(err).to.be(null);
          expect(data).to.eql({});
          done();
        }
      );
    });

    it('should call passwordless email verify removing extra parameters', function(done) {
      sinon.stub(request, 'post').callsFake(function(url) {
        expect(url).to.be('https://me.auth0.com/passwordless/verify');
        return new RequestMock({
          body: {
            connection: 'the_connection',
            email: 'me@example.com',
            verification_code: 'abc'
          },
          headers: {
            'Content-Type': 'application/json'
          },
          cb: function(cb) {
            cb(null, {
              body: {}
            });
          }
        });
      });

      this.auth0.passwordless.verify(
        {
          connection: 'the_connection',
          email: 'me@example.com',
          verificationCode: 'abc',
          state: 'random',
          response_type: 'token'
        },
        function(err, data) {
          expect(err).to.be(null);
          expect(data).to.eql({});
          done();
        }
      );
    });

    it('should call passwordless sms verify removing extra parameters', function(done) {
      sinon.stub(request, 'post').callsFake(function(url) {
        expect(url).to.be('https://me.auth0.com/passwordless/verify');
        return new RequestMock({
          body: {
            connection: 'sms',
            phone_number: '+1234567890',
            verification_code: 'abc'
          },
          headers: {
            'Content-Type': 'application/json'
          },
          cb: function(cb) {
            cb(null, {
              body: {}
            });
          }
        });
      });

      this.auth0.passwordless.verify(
        {
          connection: 'sms',
          phoneNumber: '+1234567890',
          verificationCode: 'abc',
          state: 'random',
          response_type: 'token'
        },
        function(err, data) {
          expect(err).to.be(null);
          expect(data).to.eql({});
          done();
        }
      );
    });
  });

  context('passwordless getChallenge', function () {
    context('when the client does not have state', function() {
      before(function() {
        this.auth0 = new Authentication(this.webAuthSpy, {
          domain: 'me.auth0.com',
          clientID: '...',
          redirectUri: 'http://page.com/callback',
          responseType: 'code',
          _sendTelemetry: false
        });
      });

      it('should return nothing', function(done) {
        this.auth0.passwordless.getChallenge((err, challenge) => {
          expect(err).to.not.be.ok();
          expect(challenge).to.not.be.ok();
          done();
        });
      });
    });

    context('when the client has state', function() {
      before(function() {
        this.auth0 = new Authentication(this.webAuthSpy, {
          domain: 'me.auth0.com',
          clientID: '...',
          redirectUri: 'http://page.com/callback',
          responseType: 'code',
          _sendTelemetry: false,
          state: '123abc'
        });
      });

      afterEach(function() {
        request.post.restore();
      });

      it('should post state and returns the image/type', function(done) {
        sinon.stub(request, 'post').callsFake(function(url) {
          expect(url).to.be('https://me.auth0.com/passwordless/challenge');
          return new RequestMock({
            body: {
              state: '123abc'
            },
            headers: {
              'Content-Type': 'application/json'
            },
            cb: function(cb) {
              cb(null, {
                body: {
                  image: 'svg+yadayada',
                  type: 'code'
                }
              });
            }
          });
        });

        this.auth0.passwordless.getChallenge((err, challenge) => {
          expect(err).to.not.be.ok();
          expect(challenge.image).to.be('svg+yadayada');
          expect(challenge.type).to.be('code');
          done();
        });
      });

      it('should return the error if network fails', function(done) {
        sinon.stub(request, 'post').callsFake(function(url) {
          expect(url).to.be('https://me.auth0.com/passwordless/challenge');
          return new RequestMock({
            body: {
              state: '123abc'
            },
            headers: {
              'Content-Type': 'application/json'
            },
            cb: function(cb) {
              cb(new Error('error error error'));
            }
          });
        });

        this.auth0.passwordless.getChallenge((err, challenge) => {
          expect(err.original.message).to.equal('error error error');
          done();
        });
      });
    });
  });
});

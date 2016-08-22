angular.module('TeamUp.auth', [])


  



  .controller('AuthController', function ($scope, $window, $location, UserAuth, $route ) {
  



    //===============================================================================================
    /*                                        facrbook Auth                                        */
    //===============================================================================================
    $scope.facebookUser = {};
    $scope.wrong=true;

    $scope.fbLogin = function () {
        FB.login(function (response) {
            if (response.authResponse) {
                if(response.status === "connected"){
                    getUserInfo();
                    $scope.facebookUser.fb_ID = response.authResponse.userID
                }
            } else {
                console.log('User cancelled login or did not fully authorize.');
            }
        }, {scope: 'email,user_photos,user_birthday,user_location,user_hometown'});

        function getUserInfo() {
            // get basic info
            FB.api('/me',{ locale: 'en_US', fields: 'name, location, email' }, function (response) {
                $scope.facebookUser.username = response.email;
                $scope.facebookUser.firstName = response.name.split(" ")[0]
                $scope.facebookUser.lastName = response.name.split(" ")[1]
                $scope.facebookUser.password = response.email;
                $scope.facebookUser.email = response.email;
                
                // get profile picture
                FB.api('/me/picture?type=normal', function (picResponse) {
                    $scope.facebookUser.picture = picResponse.data.url;                 
                });

                // to get friends
                FB.api("/me/friends", function (response) {
                      if (response && !response.error) {
                        $scope.facebookUser.friends = response.data
                      }
                    }
                );
                UserAuth.fbSignin({fb_ID:$scope.facebookUser.fb_ID})
                .then(function(user){
                    if(!user){
                        $scope.signup($scope.facebookUser); 
                    }else{
                        $scope.wrong=false;
                        $window.localStorage['userInfo'] = JSON.stringify(user);
                        $window.localStorage['token'] = user.token;
                        $window.localStorage['userId'] = user['user']._id;
                        $window.localStorage['isLogin'] = true;
                        $location.path('/home');
                        $window.location.reload();                      
                    }   
                })
                .then(function () {
                    $scope.islogin();
                    $location.path('/');
                })
                .catch(function (error) {
                    console.error(error)
                })

            });
        }
    };


    // Google Plus Login
    $scope.gplusLogin = function () {
        var myParams = {
            // Replace client id with yours
            'clientid': '18301237550-3vlqoed2en4lvq6uuhh88o2h1l9m70tr.apps.googleusercontent.com',
            'cookiepolicy': 'single_host_origin',
            'callback': loginCallback,
            'approvalprompt': 'force',
            'scope': 'https://www.googleapis.com/auth/plus.login https://www.googleapis.com/auth/plus.profile.emails.read'
        };
        gapi.auth.signIn(myParams);
        //console.log(myParams)
        function loginCallback(result) {
            if (result['status']['signed_in']) {
                var request = gapi.client.plus.people.get({'userId': 'me'});
                request.execute(function (resp) {
                    console.log('Google+ Login RESPONSE: ' + angular.toJson(resp));
                    var userEmail;
                    if (resp['emails']) {
                        for (var i = 0; i < resp['emails'].length; i++) {
                            if (resp['emails'][i]['type'] == 'account') {
                                userEmail = resp['emails'][i]['value'];
                            }
                        }
                    }
                    // store data to DB
                    var user = {};
                    user.name = resp.displayName;
                    user.email = userEmail;
                    if(resp.gender) {
                        resp.gender.toString().toLowerCase() === 'male' ? user.gender = 'M' : user.gender = 'F';
                    } else {
                        user.gender = '';
                    }
                    user.profilePic = resp.image.url;
                    $cookieStore.put('userInfo', user);
                    $state.go('dashboard');
                });
            }
        }
    };

 



 //===============================================================================================
 /*                                         AuthController                                       */
 //===============================================================================================

    $scope.signin = function (user) {
      UserAuth.signUser(user)
      .then(function (data) {
        $scope.wrong=false;
        $window.localStorage['token'] = data.token;
        $window.localStorage['userId'] = data.userId;
        $window.localStorage['isLogin'] = true;
        $location.path('/home');
        $window.location.reload();
      })
      .then(function () {
        $scope.islogin();
        $location.path('/');
        })
      .catch(function (err) {
        console.log(err);
        $scope.wrong=false;
        $scope.username="";
        $scope.password="";
      })
    };


    $scope.signup = function (newUser) {
        $scope.msgB = false;
        UserAuth.addNewUser(newUser)
        .then(function (user) {
            $scope.signin({
                            username:newUser.username,
                            password:newUser.password});
        })
        .catch(function (err) {
            $scope.msgB = true;
            $scope.msg = "User already exists"
            console.log($scope.msg);
            console.log($scope.msgB)
        })
    }

   

    $scope.islogin = function () {
   
      if($window.localStorage['token']  || $window.localStorage['facebookState'] === "connected"){
        $window.islogin = true;
      }else{
        $window.islogin = false;
      }
      console.log($window.islogin)
    }
})

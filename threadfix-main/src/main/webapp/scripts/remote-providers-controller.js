var module = angular.module('threadfix')

module.controller('RemoteProvidersController', function($scope, $http, $modal, $log, $window){

    $scope.providers = [];

    $scope.initialized = false;

    $scope.empty = true;

    var nameCompare = function(a,b) {
        return a.name.localeCompare(b.name);
    };

    var calculateShowImportAll = function(provider) {
        provider.showImportAll = provider.remoteProviderApplications.filter(function(app) {
            return app.application
        }).length > 0;
    };

    $scope.$watch('csrfToken', function() {
        $http.get('/configuration/remoteproviders/getMap' + $scope.csrfToken).
            success(function(data, status, headers, config) {

                if (data.success) {
                    $scope.providers = data.object.remoteProviders;
                    $scope.teams = data.object.teams;

                    $scope.defectTrackerTypes = data.object.defectTrackerTypes;

                    $scope.providers.sort(nameCompare);

                    $scope.providers.forEach($scope.paginate)

                    $scope.providers.forEach(calculateShowImportAll);


                } else {
                    $scope.errorMessage = "Failure. Message was : " + data.message;
                }

                $scope.initialized = true;
            }).
            error(function(data, status, headers, config) {
                $scope.initialized = true;
                $scope.errorMessage = "Failed to retrieve team list. HTTP status was " + status;
            });
    });

    $scope.paginate = function(provider) {
        if (provider.remoteProviderApplications) {
            if (!provider.page) {
                provider.page = 1;
            }

            var targetPage = provider.page - 1;

            if (provider.remoteProviderApplications.length > (provider.page * 100)) {
                provider.displayApps = provider.remoteProviderApplications.slice(targetPage * 100, 100 * provider.page)
            } else {
                provider.displayApps = provider.remoteProviderApplications.slice(targetPage * 100)
            }
        }
    }

    $scope.clearConfiguration = function(provider) {

        var url = "/configuration/remoteproviders/" + provider.id + "/clearConfiguration" + $scope.csrfToken;

        if (confirm("Are you sure you want to clear your " + provider.name + " configuration?")) {
            provider.clearingConfiguration = true;
            $http.post(url).
                success(function(data, status, headers, config) {
                    if (data.success) {
                        provider.username = undefined;
                        provider.apiKey = undefined;
                        provider.password = undefined;
                        provider.remoteProviderApplications = undefined;
                        provider.successMessage = undefined;
                        provider.errorMessage = undefined;
                    } else {
                        provider.errorMessage = "Error encountered: " + data.message;
                    }
                    provider.clearingConfiguration = false;
                }).
                error(function(data, status, headers, config) {
                    provider.clearingConfiguration = false;
                    provider.errorMessage = "Failed to clear configuration. HTTP status was " + status;
                });
        }
    };

    $scope.goToApp = function(app) {
        window.location.href = "/organizations/" + app.team.id + "/applications/" + app.id + $scope.csrfToken;
    };

    $scope.goToTeam = function(team) {
        window.location.href = "/organizations/" + team.id + $scope.csrfToken;
    };

    $scope.importAllScans = function(provider) {

        var url = "/configuration/remoteproviders/" + provider.id + "/importAll" + $scope.csrfToken;

        provider.importingScans = true;

        $http.get(url).
            success(function(data, status, headers, config) {
                if (data.success) {
                    // TODO better progress indicators
                    provider.successMessage = "ThreadFix is importing scans from " + provider.name +
                        " in the background. It may take a few minutes to finish the process.";
                } else {
                    provider.errorMessage = "Error encountered: " + data.message;
                }
                provider.importingScans = false;
            }).
            error(function(data, status, headers, config) {
                provider.errorMessage = "Failed to import scans. HTTP status was " + status;
                provider.importingScans = false;
            });
    }

    $scope.importScansApp = function(provider, app) {
        var url = "/configuration/remoteproviders/" + provider.id + "/apps/" + app.id + "/import" + $scope.csrfToken;

        $http.get(url).
            success(function(data, status, headers, config) {
                if (data.success && confirm("ThreadFix imported scans successfully. Would you like to go to the application's page?")) {
                    window.location.href = "/organizations/" + app.application.team.id + "/applications/" + app.application.id + $scope.csrfToken;
                } else {
                    $scope.errorMessage = "Error encountered: " + data.message;
                }
            }).
            error(function(data, status, headers, config) {
                $scope.errorMessage = "Failed to delete team. HTTP status was " + status;
            });
    }

    $scope.configure = function(provider) {
        var modalInstance = $modal.open({
            templateUrl: 'configureRemoteProviderModal.html',
            controller: 'RemoteProviderModalController',
            resolve: {
                url: function() {
                    return "/configuration/remoteproviders/" + provider.id + "/configure" + $scope.csrfToken;
                },
                type: function() {
                    return provider;
                },
                config: function() {
                    return {
                        trackerTypes: $scope.defectTrackerTypes
                    };
                },
                buttonText: function() {
                    return "Create Defect Tracker";
                }
            }
        });

        modalInstance.result.then(function (newTracker) {

            window.location.href = "/configuration/remoteproviders";

            $scope.successMessage = "Successfully edited tracker " + newTracker.name;

        }, function () {
            $log.info('Modal dismissed at: ' + new Date());
        });
    }

    $scope.openAppModal = function(provider, app) {
        var modalInstance = $modal.open({
            templateUrl: 'editRemoteProviderApplicationMapping.html',
            controller: 'ModalControllerWithConfig',
            resolve: {
                url: function() {
                    return "/configuration/remoteproviders/" + provider.id + "/apps/" + app.id + "/edit" + $scope.csrfToken;
                },
                object: function() {
                    if (!app.application) {
                        return {
                            organization: $scope.teams[0],
                            application: $scope.teams[0].applications[0]
                        }
                    } else {
                        var teamId = app.application.team.id;
                        var appId = app.application.id;

                        var filterTeam = function(team) {
                            return team.id === teamId;
                        }

                        var filterApp = function(app) {
                            return app.id === appId;
                        }

                        var team = $scope.teams.filter(filterTeam)[0]
                        var application = team.applications.filter(filterApp)[0];

                        return {
                            organization: team,
                            application: application,
                            remoteProviderType: provider
                        }
                    }
                    return app;
                },
                buttonText: function() {
                    return "Save";
                },
                config: function() {
                    return {
                        teams: $scope.teams,
                        showDelete: app.application
                    };
                },
                deleteUrl: function() {
                    if (app.application) {
                        return "/configuration/remoteproviders/" + provider.id + "/apps/" + app.id + "/delete/" + app.application.id + $scope.csrfToken;
                    } else {
                        return null;
                    }
                }
            }
        });

        modalInstance.result.then(function (editedApp) {

            app.application = editedApp.application;

            calculateShowImportAll(provider);

            $scope.successMessage = "Successfully edited tracker " + editedApp.name;

        }, function () {
            $log.info('Modal dismissed at: ' + new Date());
        });
    }

    $scope.updateApplications = function(provider) {
        var url = "/configuration/remoteproviders/" + provider.id + "/update" + $scope.csrfToken;

        provider.updatingApps = true;

        $http.get(url).
            success(function(data, status, headers, config) {
                if (data.success) {
                    provider.successMessage = "Successfully updated " + provider.name + " applications.";
                    provider.remoteProviderApplications = data.object;
                    calculateShowImportAll(provider);
                    $scope.paginate(provider);
                } else {
                    $scope.errorMessage = "Error encountered: " + data.message;
                }
                provider.updatingApps = false;
            }).
            error(function(data, status, headers, config) {
                provider.errorMessage = "Failed to update applications. HTTP status was " + status;
                provider.updatingApps = false;
            });
    };

});
'use strict';

/**
 * @ngdoc object
 * @name EventsDispatcher
 * @description Provides a constructor function for creating an events dispatcher object.
 * The new object will have an `on` method for registering to events and a `dispatch` method for firing an event.
 *
 * @example
 * <pre>
 // The following example shows how a service can support event registration and dispatching using the `EventsDispatcher` object.
 //   * `DispatcherService` is the service firing the events.
 //   * `ListenerCtrl` is a controller registering to the events.
 //   * `ListenerService` is a service registering to the events.
 angular.module('myModule').service('DispatcherService', function(EventsDispatcher) {
     var eventsDispatcher = new EventsDispatcher();

     // add to the service a public method which enables clients to register to events
     this.on = eventsDispatcher.on;

     this.setPropertyValue = function(propertyName, propertyValue) {
         // change property value...

         // dispatch event
         eventsDispatcher.dispatch('propertyChanged', propertyName, propertyValue);
     };
 });

 angular.module('myModule').controller('ListenerCtrl', function($scope, DispatcherService) {

     function onPropertyChanged(event, propertyName, propertyValue) {
         // update state according to change...
     }

     // register to the `propertyChanged` event (pass the $scope so that the listener
     // will be automatically unregistered when the scope is destroyed)
     DispatcherService.on('propertyChanged', onPropertyChanged, $scope);
 });

 angular.module('myModule').service('ListenerService', function(DispatcherService) {

     function onPropertyChanged(event, propertyName, propertyValue) {
         // update state according to change...
     }

     // register to the `propertyChanged` event
     var unregisterFn = DispatcherService.on('propertyChanged', onPropertyChanged);

     this.destroy = function() {
         // when the object is destroyed we need to explicitly unregister from the events
         // (since we didn't pass any scope when registering)
         unregisterFn();
     };
 });
 * </pre>
 */
trackerApp.factory('EventsDispatcher', function () {

    return function EventsDispatcher() {

        // an object contains all registered event listeners
        // key is the name of the event, value is an array of registered event listener functions
        var eventListeners = {};

        /**
         * @ngdoc function
         * @name EventsDispatcher#on
         * @methodOf EventsDispatcher
         * @description Registers an event listener for the specified event. The event listener will be called when the specified event is dispatched (using the {@link EventsDispatcher#dispatch dispatch} method).
         *
         * @param {String} eventName The name of the event.
         * @param {Function} eventListener The callback function to be called when the event is dispatched. When the specified event si dispatched the listener will be called with the following arguments:
         *
         *  - **event** - `{Object}` an object containing the following properties:
         *      - **name** - `{String}` The name of the dispatched event.
         *      - **stopPropagation** - `{Function}` If called by the event handler will prevent dispatching the event to other listeners which were registered after this listener.
         *  The rest of the arguments depend on the specific event being fired. They are the arguments provided to the `dispatch` event when the event was fired.
         * @param {ng.$rootScope.Scope=} scope An optional scope object. If provided the `EventsDispatcher` will automatically unregister the callback once the provided scope is destroyed.
         * If a scope is not provided the client is responsible to unregister (using the unregistration function returned from this method).
         * @returns {Function} Returns a deregistration function for this event listener.
         */
        this.on = function (eventName, eventListener, scope) {

            var off,
                unregisterScopeDestroyFn;

            var namedEventListeners = eventListeners[eventName];

            // if there is no entry for this event yet (no listener was registered to this event yet) then add a new empty entry
            if (!namedEventListeners) {
                eventListeners[eventName] = namedEventListeners = [];
            }

            // add the new listener to the array of listeners of the specified event
            namedEventListeners.push(eventListener);

            // if a scope was provided register to the destroy event -> when the scope is destroyed we will unregister the event
            if (scope) {
                unregisterScopeDestroyFn = scope.$on('$destroy', function () {
                    unregisterScopeDestroyFn = null; // reset the value so that it won't be called from `off`
                    off();
                });
            }

            // the unregistration function returned to the called -> he will be able to use it in order to explicitly unregister the event listener
            off = function () {
                // iterate all listeners registered for this event
                namedEventListeners.forEach(function (currentEventListener, index) {
                    if (currentEventListener === eventListener) {
                        // found our listener -> remove it from the list
                        namedEventListeners.splice(index, 1);
                    }
                });

                // since we already unregistered the eventListener we don't need to unregister again in scope.$destroy ->
                // so unregister from scope.destroy
                if (unregisterScopeDestroyFn) {
                    unregisterScopeDestroyFn();
                }
            };

            return off;
        };

        /**
         * @ngdoc function
         * @name EventsDispatcher#dispatch
         * @methodOf EventsDispatcher
         * @description Dispatches an event by calling all the events listeners which registered to the specified event using the {@link EventsDispatcher#on on} method.
         * The method accepts an `eventName` argument followed by a list of custom arguments. These arguments will be passed to the `eventListener` by the `on` method.
         *
         * @param {String} eventName The name of the event to dispatch.
         */
        this.dispatch = function (eventName) {
            var stopPropagation = false,
                event = {
                    name: eventName,
                    stopPropagation: function () {
                        stopPropagation = true;
                    }
                },
                listenerArgs = [event].concat(Array.prototype.slice.call(arguments, 1)),
            // NOTE: copy the original listeners array since one of the listeners might unregister from the event in the callback
            // and that will change the original array in the middle of the iteration
                namedEventListeners = angular.copy(eventListeners[eventName]),
                i;

            if (!namedEventListeners) {
                return;
            }

            // iterate the listeners and dispatch the event
            for (i = 0; i < namedEventListeners.length; i++) {
                namedEventListeners[i].apply(null, listenerArgs);
                if (stopPropagation) {
                    return;
                }
            }
        };

        /**
         * @ngdoc function
         * @name EventsDispatcher#hasListeners
         * @methodOf EventsDispatcher
         * @description Verifies whether there are any listeners to specific event
         *
         * @param {String} eventName The name of the event to check.
         */
        this.hasListeners = function (eventName) {
            return (eventListeners[eventName] !== undefined);
        };
    };
});
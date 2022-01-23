/* eslint-disable */
import React, { useRef, useState, useEffect, memo, useCallback, useMemo, Link } from 'react';

import { Select, Button, InputText, Textarea, Label } from '@buffetjs/core'
import { Header } from '@buffetjs/custom'

import QRCode from 'qrcode.react'
import Modal from 'react-modal'
import Slider from 'react-slick';

import MapboxGLGeocoder from '@mapbox/mapbox-gl-geocoder'
import 'react-tabs/style/react-tabs.css'
import MapboxGL, { Map, FullscreenControl, GeolocateControl, accessToken } from 'mapbox-gl'
import jQuery from 'jquery'

import routeIcon from './routeIcon.png'
import placeIcon from './placeIcon.png'
import polygonIcon from './polygonIcon.png'
import dropIcon from './dropIcon.png'

// BuffetJS
import { LoadingBar } from '@buffetjs/styles'

// Fontawsome...
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus } from '@fortawesome/free-solid-svg-icons'

import { setStorage, getStorage, getRouteType, alertModalStyle, getData, Draw, placesModalStyle, putData, deleteData, messages, removeStorage, checkFeaturesAmount, postData, makeId } from './map-utils.js';
import { Toast } from 'bootstrap'

import * as MyConst from './hob-const'

import 'mapbox-gl/dist/mapbox-gl.css'
import 'mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css'
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'react-responsive-carousel/lib/styles/carousel.min.css' // requires a loader
import { Carousel } from 'react-responsive-carousel'
import './index.css'

MapboxGL.accessToken = 'pk.eyJ1IjoiZHJ1bGxhbiIsImEiOiJja2l4eDBpNWUxOTJtMnRuejE1YWYyYThzIn0.y7nuRLnfl72qFp2Rq06Wlg'
const MapboxLanguage = require('@mapbox/mapbox-gl-language')

const testing = true

const host = 'https://cms.hoponboard.eu'
const routesOrigin = host + '/routes'
const polygonsOrigin = host + '/polygons'
const placesOrigin = host + '/my-places'
const instructionsOrigin = host + '/instructions'
const uploadOrigin = host

// Map vars
const placesLimit = 12

//const routesLimit = 10;
//const publishEnabled = false

const createText = 'Publish'
const defSelected = { type: 'FeatureCollection', features: [] }

const mapBoxDetails = {
  defCenter: {
    lat: 50.79,
    lng: 16.68,
    zoom: 3
  },
  tile: 'mapbox://styles/mapbox/streets-v11',
  style: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '100%',
    minHeight: '1000px'
  },
  MapboxGLGeocoder: {
    accessToken: MapboxGL.accessToken,
    marker: false
  },
  geolocator: {
    positionOptions: {
      enableHighAccuracy: true
    },
    trackUserLocation: false
  }
}

const HomePage = () => {

  // User params  
  //localStorage.clear()
  localStorage.setItem('STRAPI_UPDATE_NOTIF', true)

  // RELATE WITH STRAPI
  const username = 'asdfas'//get(auth.getUserInfo(), 'firstname', '')  
  const user_id = 13 //get(auth.getUserInfo(), 'id', '')

  // Map Settings
  const map = useRef(null)

  // MAP VIEWPORT STATE
  const [isLoading, setIsLoading] = useState(false)
  const [mapOpts, setMapOpts] = useState(mapBoxDetails.defCenter)
  const [focus, setFocus] = useState(mapOpts)

  // ROUTES RELATED
  const [routes, setRoutes] = useState([])
  const [routesCenter, setRoutesCenter] = useState(mapBoxDetails.defCenter)

  const [qrUrl, setQrUrl] = useState(null)

  // EDITOR
  const [routeMode, setMapMode] = useState('edition')

  const [route, setRoute] = useState(null)
  const [routeId, setRouteId] = useState()
  const [routeName, setRouteName] = useState('')
  const [routeIsPublished, setRouteIsPublished] = useState(false)
  const [routeDescription, setRouteDescription] = useState()

  // OTHERS
  const [instructions, setInstructions] = useState()

  /*
  // PLACE!!
  const [placeId, setPlaceId] = useState(0)
  const [placeName, setPlaceName] = useState('')
  const [placeDescription, setPlaceDescription] = useState('')


    const [routeIsPublished, setRouteIsPublished] = useState(false)
    const [routeLabel, setrouteLabel] = useState()
    const [routeDescription, setRouteDescription] = useState()
  
    //  Publish button parameters
    const [publishButtonLabel, setPublishButtonLabel] = useState(createText)

    const [publishButtonColor, setPublishButtonColor] = useState('primary')
  
    const [deleteButtonStatus, setDeleteButtonStatus] = useState(false)
  
    // New Place data
    const [placeModalStatus, setPlaceModalStatus] = useState(false)
    const [alertModalStatus, setAlertModalStatus] = useState(false)
    const [alertModalMessage, setAlertModalMessage] = useState('')
    const [alertModalLabel, setAlertModalLabel] = useState('')
    const [alertContent, setAlertContent] = useState(null)
  */

  if (typeof (window) !== 'undefined') { Modal.setAppElement('body') }

  const mapObj = {

    init: () => {
      mapObj.map.init()
      mapObj.routes.init()
      mapObj.render.initInstructions()
      if (!user_id) history.go(0)
      localStorage.setItem('user_id', user_id)
      mapObj.modes.creation()
    },

    render: {

      leftPan: () =>
        <div>
          <div ref={map} className='map-container' />
          <div className='nav-bar'>
            Lat: {focus.lat.toFixed(2)} • Lng: {focus.lng.toFixed(2)} • Zoom: {Math.round(focus.zoom)}
          </div>
        </div>,

      rightPan: () =>
        <div>
          <div className='row'>

            <div className='col-6' style={{ textAlign: 'center' }}>
              <Button
                label={'Delete'}
                color={'delete'}
                disabled={true}
                visible={true}
                className='my-button'
                onClick={(e) => { mapObj.route.delete() }}
              />
            </div>

            <div className='col-6' style={{ textAlign: 'center' }}>
              <Button
                label={'Publish'}
                color={'success'}
                disabled={true}
                visible={true}
                className='my-button'
                onClick={(e) => { mapObj.togglePublished() }}
              />
            </div>

          </div>

          <div className='row'>
            <div className='col-sm-12 col-md-12 col-lg-12'>
              {mapObj.render.routesSelector(routes)}
              {mapObj.render.instructions()}
              <LoadingBar style={{ width: '100%', opacity: isLoading ? 99 : 0 }} />

            </div>
          </div>

          <div className='row'>
            <div className='col-sm-12 col-md-12 col-lg-12' style={{ textAlign: 'center' }}>
              {qrUrl && <QRCode value={qrUrl} />}
              <br /><br /><br /><br />
              <div className='nav-bar'>
                • Mode: {routeMode} • Route: {routeId}
              </div>
            </div>
          </div>
          {/* 
             <div className='col-12'>
                <div className='row route-creator'>
                  <Label htmlFor='route-description'>Description</Label>
                  <Textarea
                    name='route-description'
                    value={routeDescription}
                    className={'description'}
                    placeholder='Set a description...'
                    required={true}
                    style={{ height: '450px', maxHeight: '450px', minHeight: '450px' }}
                    onChange={({ target: { value } }) => { mapObj.setRouteDescription(value) }}
                  />
                  <span style={{ color: routeDescription ? 'white' : 'red' }}>Please, set a route description...</span>
                </div>
              </div>
            </div>
            {mapObj.editPlaceModal()}
            {mapObj.alertModal()}
          */}
        </div>,

      routesSelector: (routes) => <div>
        {routes && <div>
          <Label htmlFor='' className={'head-advisory'}>{username}, edit your routes!</Label>
          <Select
            name='selected-route'
            className='primary'
            value={routeId}
            options={routes}
            closeMenuOnSelect={true}
            style={{ width: '97%' }}
            onChange={({ target: { value } }) => { setRouteId(value) }}>
          </Select>
        </div>
        }
      </div>,

      initInstructions: () => fetch(instructionsOrigin).then((res) => res.json()).then(setInstructions),

      instructions: () =>
        <div className='advisory-box'>
          <ul>
            {instructions && instructions.map((instr, index) => {
              return <li key={'route-' + index} style={{ cursor: 'pointer' }} onClick={() => mapObj.draw.launchOption(instr.action_class)} >
                <Label htmlFor='' style={{ cursor: 'pointer' }} className={'advisory'} >
                  <img src={uploadOrigin + instr.icon.url} style={{ cursor: 'pointer' }} alt='' /> {instr.summary}
                </Label>
              </li>
            })}
            {instructions && <li><Label htmlFor='' className={'advisory center'}>Don't forget to publish!</Label></li>}
          </ul>
        </div>,

    },

    map: {

      init: () => {
        if (!map) return
        let mapInit = {
          center: [focus.lng, focus.lat],
          container: map.current || '',
          containerStyle: mapBoxDetails.style,
          style: mapBoxDetails.tile,
          zoom: focus.zoom,
          minZoom: 4,
          maxZoom: 18
        }
        map.current = new Map(mapInit)
        map.current.on('load', mapObj.map.onLoad())
      },

      onLoad: () => {
        mapObj.map.setDraw()
        mapObj.map.addControls()
        map.current.resize()
      },

      setDraw: () => {
        map.current.on('move', (e) => mapObj.map.onMove())
        map.current.on('click', (e) => mapObj.map.onClick(e, Draw.getSelected()))
        map.current.on('draw.add', (e) => mapObj.draw.onUpdate(e, Draw.getAll()))
        map.current.on('draw.create', (e) => mapObj.draw.onUpdate(e, Draw.getAll()))
        map.current.on('draw.select', (e) => mapObj.draw.onUpdate(e, Draw.change()))
        map.current.on('draw.update', (e) => mapObj.draw.onUpdate(e, Draw.getAll()))
        map.current.on('draw.delete', (e) => mapObj.draw.onUpdate(e, Draw.getAll()))
      },

      resetDraw: () => {

      },

      addControls: () => {
        map.current.addControl(new MapboxGLGeocoder(mapBoxDetails.MapboxGLGeocoder))
        map.current.addControl(new MapboxLanguage())
        map.current.addControl(new FullscreenControl())
        map.current.addControl(new GeolocateControl(mapBoxDetails.geolocator))
        map.current.addControl(Draw, 'top-left')
      },

      removeControls: () => {

      },

      onMove: () => {
        let focus = {
          lat: map.current.getCenter().lat,
          lng: map.current.getCenter().lng,
          zoom: Math.round(map.current.getZoom())
        }
        setFocus(focus)
        setStorage('focus', focus)
      },

      onClick: (e, selected) => {

        if (selected && selected.features.length > 0) {

          getData(placesOrigin + '?element=' + selected.features[0].id)
            .then(data => {
              if (data.length === 0) {
                console.log('Element not existing!!:', selected.features[0].id)
              } else {
                console.log('Element existing!!:', selected.features[0].id)
              }

              //mapObj.resetPlace(false)
              //mapObj.storePlaceId(data[0].element)
              //mapObj.storePlaceName(data[0].name)
              //mapObj.storePlaceDescription(data[0].description[0].description)
              //setPlaceModalStatus(true)            
            })
        }
      },

      onDelete: (mapElement) => {

        if (routeIsPublished) {
          setAlert('You cannot delete an element while a map is published.\n\nPlease, ubpublish before remove elements')
          return false
        }

        var url = ''
        var type = mapElement.features[0].geometry.type
        switch (type) {
          case 'Point':
            url = placesOrigin
            break
          case 'Polygon':
            url = polygonsOrigin
            break
          case 'LineString':
            url = routesOrigin
            break
          default: break
        }

        if (type === 'Point') {
          if (!window.confirm('ALERT:\nIf you delete this Place you will lose all the related content.\n\nDo you want to continue?')) {
            return false
          }
        }

        if (type === 'LineString') {
          if (!window.confirm('ALERT:\nIf you delete this route you will must to put a new one.\n\nConsider first to edit the existent one.\n\nDo you want to continue?')) {
            return false
          }
        }

        var getUrl = url + '?element=' + mapElement.features[0].id
        getData(getUrl).then(response => {
          var delUrl = url + '/' + response[0].id
          deleteData(delUrl)
            .then(data => {
              if (data.statusCode === 400) {
                if (testing) console.log('Something was wrong deleting a route element')
              } else {
                Draw.delete()
                Draw.trash()
                if (testing) console.log('The MapElement ' + mapElement.features[0].id + ' with the id ' + data.id + ' was succesfully deleted!!')
              }
            })
        })
      },

      flyTo: (lat, long, zoom) => {
        map.current.flyTo({ center: [long, lat], zoom: zoom })
      },

    },

    routes: {

      init: () => {
        mapObj.routes.get()
        setQrUrl(host)
      },

      get: () => {
        fetch(routesOrigin + '?creator=' + user_id)
          .then((routes) => routes.json())
          .then(mapObj.routes.process)
          .catch(error => { console.error(error) })
      },

      process: (routes) => {
        mapObj.routes.setRoutesCenter(routes)
        let options = [{ value: '0', label: messages.chooseRoute }]
        if (routes) {
          for (let route of routes) {
            options.push({ value: route.id.toString(), label: route.name })
          }
        }
        setRoutes(options)
      },

      switch: (selectedRouteId) => {
        fetch(routesOrigin + '/' + selectedRouteId)
          .then((res) => res.json())
          .then(mapObj.modes.edition)
          .catch(mapObj.modes.creation)
      },      

      setRoutesCenter: (routes) => {
        let lat = 0, lng = 0, i = 0
        for (let route of routes) {
          let coordinates = route.map_data.data.geometry.coordinates
          for (let coordinate of coordinates) {
            lat = lat + parseFloat(coordinate[1])
            lng = lng + parseFloat(coordinate[0])
            ++i
          }
        }
        let res = { lat: lat / i, lng: lng / i }
        lat = 0
        lng = 0
        i = 0
        for (let route of routes) {
          let places = route.places
          for (let place of places) {
            lat = lat + parseFloat(place.map_data.center_lat)
            lng = lng + parseFloat(place.map_data.center_long)
            ++i
          }
        }
        let res2 = { lat: lat / i, lng: lng / i }
        let return_ = { lat: (res.lat + res2.lat) / 2 + 0.15, lng: (res.lng + res2.lng) / 2 + 0.6, zoom: 8 }
        console.log(return_)
        setStorage('center', return_)
      }

    },

    route: {
      create: () => { },
      update: () => { },

      delete: () => {
        if (window.confirm('ALERT:\nIf you delete the route this will delete on cascade all the related content.\n\nDo you want continue??')) {
          let route_id = getStorage('routeId', 'string')
          getData(routesOrigin + '/' + route_id)
            .then(result => {
              deleteData(routesOrigin + '/' + route_id)
                .then(result2 => {
                  if (result2.statusCode === 400) {
                    if (testing) console.log('Something was wrong deleting places on route delete cascade')
                    return false
                  } else {
                    mapObj.resetTocreation()
                    for (let place of result.places) {
                      deleteData(placesOrigin + '/' + place.id).then(result3 => {
                        if (result3.statusCode === 400) {
                          if (testing) console.log('Something was wrong deleting places on route delete cascade')
                        } else {
                          if (testing) console.log('The Place with  was succesfully deleted')
                        }
                      })
                    }
                    for (let polygon of result.polygons) {
                      deleteData(polygonsOrigin + '/' + polygon.id).then(result4 => {
                        if (result4.statusCode === 400) {
                          if (testing) console.log('Something was wrong deleting places on route delete cascade')
                        } else {
                          if (testing) console.log('The Polygon  was succesfully deleted')
                        }
                      })
                    }
                    return true
                  }
                })
            })
        } else {
          return false
        }
      },

      publish: () => { },
    },

    place: {
      create: () => { },
      cancel: () => { },
    },

    draw: {

      reset: () => {
        removeStorage('currentRoute')
        Draw.deleteAll()
        Draw.trash()
      },

      selected: (response) => {
        mapObj.draw.reset()
        let selected = defSelected
        Draw.add(response.map_data.data)
        selected.features.push(response.map_data.data)
        if (response.places !== undefined) {
          for (let place of response.places) {
            let data = place.map_data.data
            Draw.add(data)
            selected.features.push(data)
          }
        }
        if (response.polygons !== undefined) {
          for (let polygon of response.polygons) {
            let data = polygon.map_data.data
            Draw.add(data)
            selected.features.push(data)
          }
        }
        setRoute(selected)
      },

      launchOption: (type) => jQuery('.mapbox-gl-draw_' + type).click(),

      onUpdate: (mapElement) => {
        if (routeMode === 'edition') {
          mapObj.editionAction(mapElement)
        } else {
          mapObj.creationAction(mapElement)
        }
      },

    },

    modes: {

      viewAll: () => {

      },

      creation: () => {
        if (testing) console.log('CREATION MODE!:: 0')
        setMapMode('creation')
        setRouteId(0)
        mapObj.draw.reset()
        mapObj.map.flyTo(mapBoxDetails.defCenter.lat, mapBoxDetails.defCenter.lng, mapBoxDetails.defCenter.zoom)
        ////mapObj.resetPublishButton()
        //setRouteName('')
        //setRouteDescription('')
        //setTimeout(() => { setIsLoading(false) }, 3000)      

      },

      edition: (response) => {
        if (testing) console.log('EDITION MODE!::' + response.id)
        setMapMode('edition')
        mapObj.draw.selected(response)
        mapObj.map.flyTo(response.map_data.center_lat, response.map_data.center_long, response.map_data.center_zoom)
        //mapObj.draw.reset()
        //setRouteName(response.name)
        //setRouteDescription(response.description[0].description)
        ////setRouteIsPublished(response.published)
        //setTimeout(() => { setIsLoading(false) }, 3000)      
      },

      showCreationAdvisory: () => {
        if (routeId === 0) {
          if (window.confirm('Do you want to create a new route?')) {
            //mapObj.storeCreationAdvisory(Date.now())
            return true
          } else {
            Draw.trash()
            return false
          }
        }
        return true
      },

    },

  }

  useEffect(mapObj.init, [])

  useEffect(() => {
    mapObj.routes.switch(routeId)
  }, [routeId])

  /*

    
    ,   




    

    
        cancelPlaceEdition: () => {
          let mapElement = getStorage('tmpPoint', 'json')
          if (mapElement) {
            if (placeId === 0) {
              if (testing) console.log('You are aborting to save the Place')
              Draw.delete(mapElement.id)
            } else {
              mapObj.resetPlace(false)
            }
          } else {
            mapObj.resetPlace(false)
          }
        },
    
        savePlace: (event) => {
          event.preventDefault()
          let mapElement = getStorage('tmpPoint', 'json')
          if (mapElement !== '') {//Undo
            if (placeName === '' && placeDescription === '') {//&& placeLabel === '' 
              return false
            } else {
              mapObj.postPlace(mapElement)
            }
          } else {
            setAlert('Theres is not data to save about the place');
            Draw.trash()
            setPlaceModalStatus(false)
          }
        },
    
  
    
        resetPlace: (status) => {
          setPlaceModalStatus(status)
          if (!status) {
            setStorage('place_id', 0)
            setStorage('place_name', '')
            setStorage('place_label', '')
            setStorage('place_description', '')
          }
        },
    
        routeUnselected: () => {
          console.log(routeId)
          return routeId === 0
        },
    
        renderRouteEditionForm: () => {
          return (
            <div>
              <div className='row'>
                <Label htmlFor='route-name'>Edit name</Label>
                <InputText
                  type='text'
                  name='route-name'
                  value={routeName}
                  placeholder='Set the route name...'
                  required={true}
                  onChange={({ target: { value } }) => { mapObj.setRouteName(value) }}
                />
                <Button
                  label={'Save'}
                  type='submit'
                  onClick={savePlace}
                />
              </div>
              <div className='row'>
                <span style={{ opacity: routeName ? 0 : 1 }}>Please, set a route name...</span>
              </div>
            </div>
          )
        },
    
        editionAction: (mapElement) => {
          if (!mapObj.routeUnselected()) {
            if (testing) console.log('Edition route mode ' + routeId + ' action!')
            if (mapObj.showChangeAdvisory()) {
              if (mapElement.action !== undefined) {
                if (mapElement.action === 'change_coordinates' || mapElement.action === 'move') {
                  mapObj.updateRouteElement(mapElement)
                } else {
                  if (testing) console.log('Uncontrolled action :// !!!' + mapElement.action)
                }
              } else {
                if (mapElement.features[0].geometry.type === 'LineString') {
                  let storedLinesAmount = mapObj.checkFeaturesAmount(route, 'LineString')
                  if (storedLinesAmount > 1) {
                    mapObj.setAlert('You cannot add more than one route. Delete one!')
                    return false
                  }
                }
                switch (mapElement.type) {
                  case 'draw.create':
                    mapObj.createMapElement(mapElement)
                    break
                  case 'draw.update':
                    mapObj.updateRouteElement(mapElement)
                    break
                  case 'draw.delete':
                    mapObj.onDelete(mapElement)
                    break
                  default:
                    if (testing) console.log('Uncontrolled action :// !!!' + mapElement.action)
                    break
                }
              }
            }
          }
        },
    
        creationAction: (mapElement) => {
    
          if (routeId === 0) {
    
            if (testing) console.log('Creation mode map action!')
    
            if (mapObj.showCreationAdvisory()) {
    
              if (mapElement.type === 'draw.create') {
    
                let name = (getStorage('routeName', 'string')) ? getStorage('routeName', 'string') : 'New route'
                //var label         = (getStorage('routeLabel', 'string')) ? getStorage('routeLabel', 'string') : 'New route label'
                let description = (getStorage('routeDescription', 'string')) ? getStorage('routeDescription', 'string') : 'New route description...'
                let isLineString = mapElement.features[0].geometry.type === 'LineString'
                let type = mapElement.features[0].geometry.type
    
                postData(routesOrigin, {
                  'name': name,
                  'creator': user_id,
                  'element': mapElement.features[0].id,
                  'description': [{
                    'language': 1,
                    'label': name,//label,
                    'description': description
                  }],
                  'map_data': mapObj.setMapData(isLineString ? mapElement.features[0] : '')
                })
                  .then(res => {
    
                    if (res.statusCode === 400) {
                      if (testing) console.log('Something was wrong with onUpdate creation mode action...')
                    } else {
    
                      if (testing) console.log('You have created the element id ' + res.map_data.data.id + ' as route with the id ' + res.id)
    
                      setMapMode('edition')
                      storeChangeAdvisory(true)
    
                      if (isLineString) {
    
                        // Setting main inputs ;)
                        if (testing) console.log('The element is a LineString')
                        setRouteId(res.id)
                        setRouteName(name)
                        setRouteDescription(description)
                        //setPublishButtonStatus(!true)
    
                        setRoute(res.map_data.data)
                        mapObj.setAlert('You have created the new route  \n ' + routeName, 'GRETTINGS!', contentGrettings(res.id))
    
                      } else {
    
                        if (type === 'Point') {
                          if (testing) console.log('The element is a Point')
                          //XXX: The point requires a modal to save the textual data
                          mapObj.resetPlace(true);
                          setStorage('tmpPoint', mapElement.features[0], 'json')
                        } else if (type === 'Polygon') {
                          if (testing) console.log('The element is a Polygon')
                          mapObj.postPolygon(mapElement.features[0], newId)
                        }
    
                      }
    
                      mapObj.setPublishable()
    
                    }
    
                  })
    
              }
    
            } else {
              if (testing) console.log('Burp...')
            }
    
          }
    
        },
    
        contentGrettings: (id) => {
          return (<Link to={'/admin/plugins/content-manager/collectionType/application::routes.routes/' + id} className='btn btn-primary'>Add media</Link>)
        },
    
        updateRouteExtra: () => {
          if (!mapObj.routeUnselected()) {
            setIsLoading(true)
            if (routeName !== '' && routeDescription !== '') {//&& routeLabel !== ''
              putData(routesOrigin + '/' + routeId, {
                'name': routeName,
                'description': [{
                  'language': 1,
                  'label': routeName,
                  'description': routeDescription
                }]
              })
                .then()
            }
            setIsLoading(false)
          }
        },
    
        createMapElement: (mapElement) => {
          let route = parseInt(getStorage('routeId', 'string'))
          let type = mapElement.features[0].geometry.type
          if (type === 'Polygon') {
            postData(polygonsOrigin, {
              'name': 'Polygon route ' + mapElement.features[0].id,
              'creator': user_id,
              'parent_route': route,
              'element': mapElement.features[0].id,
              'map_data': mapObj.setMapData(mapElement.features[0])
            })
              .then(result => {
                if (result.statusCode === 400) {
                  if (testing) console.log('Something was wrong creating a Polygon')
                } else {
                  if (testing) console.log('The Polygon ' + mapElement.features[0].id + ' with the id ' + result.id + ' to the route ' + route + ' was succesfully created!!')
                }
              })
          } else if (type === 'Point') {
            // XXX: Call to a Places modal...
            mapObj.resetPlace(true);
            setStorage('tmpPoint', mapElement.features[0], 'json')
          }
        },
    
        setMapData: (features) => {
    
          console.log(features)
    
          let focus = getStorage('focus')
    
          let lat = mapBoxDetails.defCenter.lat
          let lng = mapBoxDetails.defCenter.lng
          let zoom = mapBoxDetails.defCenter.zoom
    
          if (focus) {
            lat = getStorage('focus').lat
            lng = getStorage('focus').lng
            zoom = getStorage('focus').zoom
          }
    
          return {
            'center_lat': lat,
            'center_long': lng,
            'center_zoom': zoom,
            'data': features,
          }
    
        },
    
        updateRouteElement: (mapElement) => {
          let url = ''
          let type = mapElement.features[0].geometry.type
          let id = mapElement.features[0].id
          switch (type) {
            case 'Point':
              url = placesOrigin
              break
            case 'Polygon':
              url = polygonsOrigin
              break
            default:
            case 'LineString':
              url = routesOrigin
              break
          }
          let urlGet = url + '?element=' + id
          getData(urlGet)
            .then(response => {
              if (response.statusCode === 400) {
                if (testing) console.log('Something was wrong with updateRouteElement action...')
              } else {
                if (testing) console.log('The updateRouteElement first response')
                if (testing) console.log(response)
    
                if (testing) console.log('You got the desired element ' + id)
                let putUrl = url + '/' + response[0].id
    
                putData(putUrl, { 'map_data': mapObj.setMapData(mapElement.features[0]) })
                  .then(data => {
                    if (data.statusCode === 400) {
                      if (testing) console.log('Something was wrong with updateRouteElement action...')
                    } else {
                      let res = (type === 'LineString') ? id : id
                      if (testing) console.log('The Element ' + id + ' with the id ' + res + ' was succesfully updated!!')
                    }
                  })
              }
            })
        },
    
        postPlace: (placeFeatures) => {
          if (!placeFeatures) return false
          postData(placesOrigin, {
            'name': placeName,
            'creator': user_id,
            'parent_route': routeId,
            'element': placeFeatures.id,
            'description': [{
              'language': 1,
              'label': placeName,// 'New route label',
              'description': placeDescription
            }],
            'map_data': mapObj.setMapData(placeFeatures)
          })
            .then(data => {
              if (data.statusCode === 400) {
                if (testing) console.log('Something was wrong with creating a Place...')
              } else {
                if (testing) console.log('Place ' + placeFeatures.id + ' posted successful ;)')
                mapObj.resetPlace(false)
              }
            })
        },
    
        postPolygon: (polygonFeatures, i) => {
          postData(polygonsOrigin, {
            'name': routeName + ' Warning ' + routeId + '-' + i.toString(),
            'creator': user_id,
            'parent_route': routeId,
            'element': polygonFeatures.id,
            'map_data': mapObj.setMapData(polygonFeatures)
          })
            .then(data => {
              if (data.statusCode === 400) {
                if (testing) console.log('Something was wrong creating a Polygon')
              } else {
                if (testing) console.log('Polygon ' + data.id + ' posted successful ;)')
              }
            })
        },
    
        togglePublished: () => {
          if (testing) console.log('togglePublished: Is published: ' + routeIsPublished)
          if (routeIsPublished) {
            if (testing) console.log('Unpublishing??')
            if (window.confirm('ALERT:\nIf you continue the route will disapear from the app after next app data upgrade\n\nDo you wanna unpublish the route?')) {
              setRouteIsPublished(false)
            } else {
              return false
            }
          } else {
    
            if (mapObj.validatePublishing()) {
              if (testing) console.log('Publishing??')
              if (window.confirm('ALERT:\nIf you continue the route will appear from the app after next app data upgrade\n\nDo you wanna publish the route?')) {
                setRouteIsPublished(true)
              } else {
                return false
              }
            } else {
              return false
            }
          }
    
          putData(routesOrigin + '/' + routeId, { published: !routeIsPublished })
            .then(data => {
              let action = ((!routeIsPublished) ? 'published' : 'unpublished')
              setAlert('The route ' + routeName + ' was succesfully ' + action + '!')
            })
        },
    
        validatePublishing: () => {
    
          if (testing) console.log('validatePublishing attempt... is route! ;))')
    
          getData(routesOrigin + '/' + routeId)
            .then(result => {
    
              if (result.places.length === 0) {
                funs.launchToast('To publish a good quality route, please set at least a Place...')
                return false
              } else {
                for (let place of result.places) {
                  if (place.description === '' || place.images.length === 0) {
                    funs.launchToast('Please set your Place images, markers and descriptions before publish the route...')
                    return false
                  }
                }
              }
    
            })
    
          return true
    
        },
    
        resetPublishButton: () => {
          setPublishButtonStatus(false)
          setPublishButtonLabel(createText)
        },
    
        setPublishable: () => {
          setPublishButtonStatus(true)
          setPublishButtonLabel('Publish')
          mapObj.storePublishButtonColor('primary')
        },
    
        setUnpublishable: () => {
          setPublishButtonStatus(true)
          setPublishButtonLabel('Unpublish')
          mapObj.storePublishButtonColor('success')
        },
    
        launchToast: (message, doContinue = false, label) => {
          setAlert(message, label)
          return doContinue
        },
    
        showChangeAdvisory: () => {
          console.log('routeId', routeId)
          //let adv = getStorage('routeChangesAdvisory', 'string')
          //if (!adv) {
          //  if (window.confirm('Do you want to edit this route?')) {
          //    setStorage('routeChangesAdvisory', true)
          //    return true
          //  } else {
          //    return false
          //  }
          //}
          //return true
        },
    
        setAlert: (message, label = '', content = null) => {
          setAlertModalMessage(message)
          setAlertModalLabel(label)
          setAlertContent(content)
          setAlertModalStatus(true)
        },
    
        closeAlert: (message) => {
          setAlertModalStatus(false)
        },
    
        editPlaceModal: () => {
          return (
            <Modal
              isOpen={false}
              style={placesModalStyle}
              contentLabel='Save your place'
            >
              <div className='table'>
                <div className='row'>
                  <Label htmlFor='place-name'><h2>Set the place data</h2></Label>
                </div>
                <div className='row'>
                  <Label htmlFor='place-name'>Edit Place Name</Label>
                  <InputText
                    type='text'
                    name='place-name'
                    className='my-input'
                    value={placeName}
                    placeholder='Set here the Place Name for this route...'
                    required={true}
                    style={{ width: '171%' }}
                    onChange={({ target: { value } }) => { mapObj.storePlaceName(value) }}
                  />
                </div>
                <div className='row'>
                  <span style={{ color: placeName ? 'white' : 'red' }}>Please, set a place name...</span>
                </div>
                <div className='row'>
                  <Label htmlFor='place-description'>Description</Label>
                  <Textarea
                    name='route-description'
                    className={'description'}
                    placeholder='Set here the description for this place...'
                    required={true}
                    style={{ maxHeight: '261px', height: '261px' }}
                    onChange={({ target: { value } }) => { storePlaceDescription(value) }}
                    value={placeDescription}
                  />
                </div>
                <div className='row'>
                  <span style={{ color: placeDescription ? 'white' : 'red' }}>Please, set a place label...</span>
                </div>
                <div className='row'>
                  <LoadingBar style={{ width: '100%', opacity: isLoading ? 99 : 0 }} />
                  <div className='col-6' style={{ textAlign: 'center', marginTop: '20px' }}>
                    <Button
                      label={'Save'}
                      type='submit'
                      onClick={mapObj.savePlace}
                      className='my-button'
                    />
                  </div>
                  <div className='col-6' style={{ textAlign: 'center', marginTop: '20px' }}>
                    <Button
                      label={'Cancel'}
                      color={'delete'}
                      onClick={mapObj.cancelPlaceEdition}
                      className='my-button'
                    />
                  </div>
                </div>
              </div>
            </Modal>
          )
        },
    
        alertModal: () => {
          return (
            <Modal
              isOpen={false}
              contentLabel={''}
              style={alertModalStyle}
              shouldCloseOnOverlayClick={true}
            >
              <div style={{ minHeight: '90%', textAlign: 'center' }}>
                <Label htmlFor='input' style={{ color: 'white' }} message={''} />
                <Label htmlFor='input' message={''} />
                <div>{''}</div>
              </div>
              <Button
                label={'OK'}
                color={'warning'}
                onClick={mapObj.closeAlert}
              />
            </Modal>
          )
        },
    
        renderCarrousel: () => {
          return (
            <div>
              <h2> Single Item</h2>
              <Carousel>
                <div>
                  <h3>1</h3>
                </div>
                <div>
                  <h3>2</h3>
                </div>
              </Carousel>
            </div>
          )
        },
    
    }   
  */

  return <div>
    <div className='row'>
      <div className='col-sm-8 col-md-8 col-lg-8'>
        {mapObj.render.leftPan()}
      </div>
      <div className='col-sm-4 col-md-4 col-lg-4'>
        {routes && mapObj.render.rightPan()}
      </div>
    </div>
  </div>

}

export default memo(HomePage)

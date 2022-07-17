
import React, { Component } from 'react';
import './App.css';
import Plot from 'react-plotly.js';
import _ from 'lodash';
import Fabric from 'jsc8';

import TradesTable from "./components/TradesTable"
import Logomark from "./logomark.svg"
import {
  convertToDecimal,
  makeChartData,
  getChartData,
  makeCollectionArray,
  makeCollectionData,
  CONSTANTS,
  getQuoteStreamTopicName,
  getCollectionName,
  getRandomInt
} from './utils';

import Snackbar from '@material-ui/core/Snackbar';
import TextField from '@material-ui/core/TextField';
import { withStyles } from '@material-ui/core/styles';


import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';

import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';

const { CHART1, CHART2, CHART3, BACKGROUND } = CONSTANTS;

class App extends Component {

  constructor(props) {
    super(props);
    this.state = {
      width: 0,
      height: 0,
      [CHART1]: {
        name: 'USD',
        close: [],
        ma: [],
        timestamp: [],
        stream: undefined
      },
      [CHART2]: {
        name: 'EUR',
        close: [],
        ma: [],
        timestamp: [],
        stream: undefined
      },
      [CHART3]: {
        name: 'JPY',
        close: [],
        ma: [],
        timestamp: [],
        stream: undefined
      },
      collectionData: [],
      filteredData: [],
      showSnackbar: false,
      snackbarText: '',
      showFiltered: false,
      regionModal: false,
      availableRegions: null,
      selectedRegionUrl: null,
      loginModal: true,
      federationUrl: "xxx.macrometa.io",
      fabric: 'xxxx',
      email: "xxxx@macrometa.io",
      password: 'xxxx',
      selectedRegionName: null
    };
    this.updateWindowDimensions = this.updateWindowDimensions.bind(this);
    this.establishConnection = this.establishConnection.bind(this);
    this.handleClose = this.handleClose.bind(this);
    this.openSnackBar = this.openSnackBar.bind(this);
    this.handleSearchTextChange = this.handleSearchTextChange.bind(this);
    this.jwtToken = undefined;
    this.fabric = undefined;
    this.collection = undefined;
  }


  componentDidMount() {
    this.updateWindowDimensions();
    window.addEventListener('resize', this.updateWindowDimensions)

  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.updateWindowDimensions);

    [CHART1, CHART2, CHART3].forEach(chartNum => {
      this.state[chartNum].stream.closeConnections();
    });

    this.collection.closeOnChangeConnection();

  }

  async initData() {
    let charts = [CHART1, CHART2, CHART3];
    for (let i = 0; i < charts.length; i++) {
      charts[i] = await this.establishConnection(i);
    }

    this.setState({
      [CHART1]: charts[CHART1],
      [CHART2]: charts[CHART2],
      [CHART3]: charts[CHART3]
    });
    this.getDocumentData();
    this.establishDocumentConnection();
  }

  async selectedRegionLogin() {
    this.fabric.close();
    const { selectedRegionUrl, email, password } = this.state;
    const fabricName = this.state.fabric;
    this.fabric = new Fabric(`https://${selectedRegionUrl}`);
    try {
      await this.fabric.login(email, password);
      this.fabric.useFabric(fabricName);
      // start streams and get collection data
      await this.initData();
    } catch (e) {
      this.openSnackBar('Failed to login with selected region.');
      console.log(e);
    }
  }

  async login() {
    const { federationUrl, email, password } = this.state;
    const fabricName = this.state.fabric;
    this.fabric = new Fabric(`https://${federationUrl}`);
    try {
      const res = await this.fabric.login(email, password);
      this.fabric.useFabric(fabricName);
      const deployedRegions = await this.fabric.get();
      const regions = deployedRegions.options.dcList.split(",");
      const tenantHandler = this.fabric.tenant("", res.tenant);
      const locations = await tenantHandler.getTenantEdgeLocations();
      const { dcInfo } = locations[0];
      const availableRegions = dcInfo.filter((dcObject) => {
        return regions.indexOf(dcObject.name > -1);
      })
      // const tempAvailableRegions = availableRegions.filter(
      //   (availableRegion) => availableRegion.name !== "gdn1-sfo2"
      // );

      this.setState({
        availableRegions,
        regionModal: true,
      });
    } catch (e) {
      this.openSnackBar('Auth failed.');
      console.log(e);
    }
  }

  async getDocumentData() {
    try {
      const cursor = await this.fabric.query("FOR trade IN trades SORT trade.timestamp DESC LIMIT 20 RETURN trade");
      const result = await cursor.all();
      this.setState({ collectionData: makeCollectionArray(result) });
    } catch (e) {
      e.status !== 404 && this.openSnackBar('Could not get document data');
    }

  }

  async establishDocumentConnection() {

    const collectionName = getCollectionName();
    this.collection = this.fabric.collection(collectionName);
    const consumer = await this.collection.onChange(
      this.state.selectedRegionUrl,
      `${collectionName}-sub${getRandomInt()}`
    );

    consumer.on("error", () => {
      this.openSnackBar('Failed to establish WS connection for trades');
      console.log('Failed to establish WS connection for trades');
    });

    consumer.on("message", (msg) => {
      const receiveMsg = JSON.parse(msg);
        const { payload } = receiveMsg;
        if (receiveMsg && payload) {
          const decodedMsg = atob(payload);
          const response = decodedMsg && JSON.parse(decodedMsg);
          let collectionData = [...this.state.collectionData];
          const newElem = makeCollectionData(response);
          if (newElem) {
            collectionData = [newElem, ...collectionData];
          }
          if (collectionData.length > 20) {
            //remove more than 20 data points
            collectionData = collectionData.slice(0, 20);
          }
          this.setState({ collectionData });
        }
    });

    consumer.on("close", () => {
      console.log('Closing WS connection for trades');
    });

    consumer.on("open", () => {
      console.log("WebSocket is open for trades");
    });

    // this.collection.onChange({
    //   onopen: () => console.log("WebSocket is open for trades"),
    //   onclose: () => console.log('Closing WS connection for trades'),
    //   onerror: () => {
    //     this.openSnackBar('Failed to establish WS connection for trades');
    //     console.log('Failed to establish WS connection for trades');
    //   },
    //   onmessage: message => {
    //     const receiveMsg = JSON.parse(message);
    //     const { payload } = receiveMsg;
    //     if (receiveMsg && payload) {
    //       const decodedMsg = atob(payload);
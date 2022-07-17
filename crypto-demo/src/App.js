
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
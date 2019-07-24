// Copyright (c) Jeremy Tuloup
// Distributed under the terms of the Modified BSD License.

import {
  DOMWidgetModel,
  DOMWidgetView,
  ISerializers
} from "@jupyter-widgets/base";

import * as React from 'react';

import {
  MemoryUsageComponent
} from 'jupyterlab-system-monitor-base';

import 'jupyterlab-system-monitor-base/style/index.css';

import { MODULE_NAME, MODULE_VERSION } from "./version";
import ReactDOM from "react-dom";

export class KernelMemoryUsageModel extends DOMWidgetModel {
  defaults() {
    return {
      ...super.defaults(),
      _model_name: KernelMemoryUsageModel.model_name,
      _model_module: KernelMemoryUsageModel.model_module,
      _model_module_version: KernelMemoryUsageModel.model_module_version,
      _view_name: KernelMemoryUsageModel.view_name,
      _view_module: KernelMemoryUsageModel.view_module,
      _view_module_version: KernelMemoryUsageModel.view_module_version,
      _current: 0,
      limit: 0,
      label: "Mem:",
      _percentage: null,
      _values: []
    };
  }

  static serializers: ISerializers = {
    ...DOMWidgetModel.serializers
  };

  static model_name = "KernelMemoryUsageModel";
  static model_module = MODULE_NAME;
  static model_module_version = MODULE_VERSION;
  static view_name = "KernelMemoryUsageView"; // Set to null if no view
  static view_module = MODULE_NAME; // Set to null if no view
  static view_module_version = MODULE_VERSION;
}

interface IMemoryComponentState {
  label: string;
  text: string;
  values: number[];
  percentage: number | null;
}

class MemoryComponent extends React.Component<{model : any}, IMemoryComponentState> {
  constructor(props: any) {
    super(props);
    this.state = {
      label: "",
      text: "",
      values: [],
      percentage: null
    };
  }

  componentDidMount = () => {
    this.setupListeners();
  }

  componentWillUnmount = () => {
    this.removeListeners();
  }

  setupListeners = () => {
    const { model } = this.props;
    model.on('change', () => {
      this.setState({
        label: model.get('label'),
        text: model.get('_text'),
        values: model.get('_values'),
        percentage: model.get('_percentage'),
      })
    })
  }

  removeListeners = () => {
    const { model } = this.props;
    model.off();
  }

  render() {
    return (
      <MemoryUsageComponent
        style={{height: "40px"}}
        {...this.state}
      />
    );
  }
}

export class KernelMemoryUsageView extends DOMWidgetView {
  initialize() {
    const element = React.createElement(MemoryComponent, { model: this.model });
    ReactDOM.render(element, this.el);
  }
}

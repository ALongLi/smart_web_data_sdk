import {
  CONFIG,
  DEFAULT_CONFIG,
  SYSTEM_EVENT_TYPE,
  BUSSINESS_EVENT_TYPE,
  SYSTEM_EVENT_LIST
} from './config'

import {_, console} from './utils';

// 用户属性追踪
import USER_TRACK from './user_track'
// 用户事件追踪
import EVENT_TRACK from './event_track'
// 本地存储
import LOCAL_STORAGE from './local_storage'
// 单页面
import SPA from './spa'

class SMART {
  /**
   * 
   * @param {String} token 上报数据凭证
   * @param {Object} config sdk客户端配置
   */
  constructor(token, config) {
    this['__loaded'] = true;
    this['config'] = {};
    this._set_config(_.extend({}, DEFAULT_CONFIG, CONFIG, config, {'token': token}));
    this['local_storage'] = new LOCAL_STORAGE(this['config']);
    this['local_storage'].register_once({
      updatedTime: 0,
      sessionStartTime: 0
    });
    // 运行钩子函数
    this._loaded();
    // 设置设备凭证
    this._set_device_id();
  }
  /**
   * 设置配置
   * @param {Object} config 
   */
  _set_config(config) {
    if (_.isObject(config)) {
      _.extend(this['config'], config);
      CONFIG.DEBUG = CONFIG.DEBUG || this._get_config('debug');
    }
  }
  /**
   * 获取某个配置
   * @param {String} prop_name
   * @returns {*} 
   */
  _get_config(prop_name) {
    return this['config'][prop_name];
  }
  // sdk初始化之前触发的钩子函数，该方法必须在初始化子模块前以及上报数据前使用
  _loaded() {
    try {
      this._get_config('loaded')(this);
    } catch (error) {
      console.error(error);
    }
  }
  /**
   * 设置本地设备凭证
   * 若是首次访问（本地无设备凭证），上报用户首次访问网站事件
   */
  _set_device_id() {
    let track_data = {};
    if (!this.get_device_id()) {
      this['local_storage'].register_once({'deviceId': _.UUID()}, '');
      track_data = this.track('smart_activate');
    }
    return track_data;
  }
  /**
   * TODO
   * 判断指定事件是否被禁止上报
   * @param {String} event_name
   * @returns {Boolean} 
   */
  _event_is_disabled(event_name) {
    return true;
  }
  // 获取唯一凭证（设备标记）
  get_device_id() {
    return get_property('deviceId');
  }
  // 获取指定本地存储属性（缓存和本地）
  get_property(prop_name) {
    return this['local_storage']['props'][prop_name];
  }
  /**
   * 设置一个指定事件的耗时监听器
   * @param {String} event_name
   */
  time_event(event_name) {
    if (_.isUndefined(event_name)) {
      console.error('事件耗时监听器需要一个事件名称');
      return;
    }
    // 被禁止的事件，无需监听
    if (this._event_is_disabled(event_name)) {
      return;
    }
    this['local_storage'].set_event_timer(event_name, new Date().getTime());
  }
  /**
   * 追踪事件（上报用户事件触发数据）
   * @param {String} event_name 事件名称
   * @param {Object} properties 事件属性
   * @param {Function} callback 上报后的回调方法
   * @returns {Object} track_data 上报的数据
   */
  track(event_name, properties, callback) {
    if (_.isUndefined(event_name)) {
      console.error('上报数据需要一个事件名称');
      return;
    }
    if (!_.isFunction(callback)) {
      callback = function() {};
    }
    if (this._event_is_disabled(event_name)) {
      callback(0);
      return;
    }
    // 重新在本地取数据读取到缓存
    this['local_storage'].load();
    // 事件属性
    properties = properties || {};
    // 标记：传入的属性另存一份
    let user_set_properties = _.JSONDecode(_.JSONEncode(properties)) || {};
    let costTime;
    // 移除该事件的耗时监听器，获取设置监听器的时间戳，计算耗时
    const start_listen_timestamp = this['local_storage'].remove_event_timer(event_name);
    if (!_.isUndefined(start_listen_timestamp)) {
      costTime = new Date().getTime() - start_listen_timestamp;
    }
  }
}

export default SMART;
import { request } from 'http';
import React from 'react';
import ReactDOM from 'react-dom';
import chroma from 'chroma-js';
import * as Three from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import './model.css';

class ModelWidget extends React.Component {

    constructor(props) {
        super(props)
        // ref
        this.modelRef = React.createRef();
        this.instructionsRef = React.createRef();
        this.blockerRef = React.createRef();
        // left right back left
        this.moveLeft = false;
        this.moveRight = false;
        this.moveBack = false;
        this.moveForward = false;
        this.controlsEnabled = false;
        this.walkSpeed = 2000.0;
        // velocity
        this.velocity = new Three.Vector3();
        this.direction = new Three.Vector3();
        this.clock = new Three.Clock();
        this.setRandomColors = this.setRandomColors.bind(this);
    }


    renderModel() {
        //执行渲染操作   指定场景、相机作为参数
        this.renderer.render(this.scene, this.camera);
    }

    updateMovement = () => {
        if (this.controlsEnabled) {
            let delta = this.clock.getDelta();
            // this.velocity.x -= this.velocity.x * 10.0 * delta;
            // this.velocity.z -= this.velocity.z * 10.0 * delta;
            this.velocity.y -= 9.8 * 10.0 * delta;
            if (this.moveForward) {
                console.log('forward');
                this.velocity.z =- this.walkSpeed * delta;
            this.control.getObject().translateZ(this.velocity.z * delta);
            }
            if (this.moveBackward) {
                console.log('backward');
                this.velocity.z = this.walkSpeed * delta;
            this.control.getObject().translateZ(this.velocity.z * delta);
            }
            if (this.moveLeft) {
                console.log('left');
                this.velocity.x =- this.walkSpeed * delta;
            this.control.getObject().translateX(this.velocity.x * delta);
            }
            if (this.moveRight) {
                console.log('right');
                this.velocity.x = this.walkSpeed * delta;
            this.control.getObject().translateX(this.velocity.x * delta);
            }
            console.log("(%f,%f,%f)", this.velocity.x, this.velocity.y, this.velocity.z);
            // 可以播放音效
            this.control.getObject().translateY(this.velocity.y * delta);
            if (this.control.getObject().position.y < 10) {
                this.velocity.y = 0;
                this.control.getObject().position.y = 10;
            }
        }

    }

    start() {
        if (!this.renderId) {
            this.renderId = requestAnimationFrame(this.animate);
        }
    }


    animate = () => {
        this.updateMovement();
        this.renderModel();
        this.renderId = requestAnimationFrame(this.animate);
    }

    stop() {
        cancelAnimationFrame(this.renderId);
    }

    loadModel = () => {
        this.mtlLoder = new MTLLoader();
        this.mtlLoder.load('city.mtl', (material) => {
            var objLoader = new OBJLoader();
            objLoader.setMaterials(material);
            objLoader.load('city.obj', (object) => {
                let scale = chroma.scale(['yellow', '008ae5']);
                this.setRandomColors(object, scale);
                object.scale.set(5, 5, 5);
                this.scene.add(object);
                console.log('model loaded');
            });

        });
    }

    setRandomColors = (object, scale) => {
        //获取children数组
        var children = object.children;

        //如果当前模型有子元素，则遍历子元素
        if (children && children.length > 0) {
            children.forEach((e) => {
                this.setRandomColors(e, scale)
            });
        } else {
            if (object instanceof Three.Mesh) {
                //如果当前的模型是楼层，则设置固定的颜色，并且透明化
                if (Array.isArray(object.material)) {
                    for (var i = 0; i < object.material.length; i++) {
                        var material = object.material[i];
                        var color = scale(Math.random()).hex();
                        if (material.name.indexOf("building") === 0) {
                            material.color = new Three.Color(color);
                            material.transparent = true;
                            material.opacity = 0.7;
                            material.depthWrite = false;
                        }
                    }
                }
                // 如果不是场景组，则给当前mesh添加纹理
                else {
                    //随机当前模型的颜色
                    object.material.color = new Three.Color(scale(Math.random()).hex());
                }
            }
        }
    }

    componentDidMount() {
        /**
         * 创建场景对象Scene
         */
        this.scene = new Three.Scene();
        this.loadModel();
        /**
         * 光源设置
         */
        // this.scene.add(this.createFloor());
        //点光源
        var point = new Three.PointLight(0xffffff);
        point.position.set(400, 200, 300); //点光源位置
        this.scene.add(point); //点光源添加到场景中
        //环境光
        var ambient = new Three.AmbientLight(0x444444);
        ambient.position.set(0, 50, 0);
        ambient.castShadow = true; // shadow
        this.scene.add(ambient);
        // console.log(scene)
        // console.log(scene.children)
        /**
         * 相机设置
         */
        var width = window.innerWidth; //窗口宽度
        var height = window.innerHeight; //窗口高度
        //创建相机对象
        this.camera = new Three.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        // 地板高度
        /**
         * 创建渲染器对象
         */
        this.renderer = new Three.WebGLRenderer();
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(width, height); //设置渲染区域尺寸
        this.renderer.setClearColor(0x9A9A9A, 1); //设置背景颜色
        // 控制
        this.control = new PointerLockControls(this.camera);
        this.control.getObject().position.y = 50;
        this.control.getObject().position.x = 100;
        this.scene.add(this.control.getObject());
        this.raycaster = new Three.Raycaster(new Three.Vector3(), new Three.Vector3(0, -1, 0), 0, 10);
        // this.raycaster.ray.origin.copy(this.control.position);

        this.modelRef.current.appendChild(this.renderer.domElement);
        // 监听
        document.addEventListener('keydown', this.onKeyDown);
        document.addEventListener('keyup', this.onKeyUp);
        this.control.enabled = true;
        this.initPointerLock();
        this.start();
    }
    pointerlockchange = (event) => {
        var element = document.body;
        if (document.pointerLockElement === element || document.mozPointerLockElement === element || document.webkitPointerLockElement === element) {
            this.controlsEnabled = true;
            this.control.enabled = true;
            // this.instructionsRef.current.display = 'none';
            // this.blockerRef.current.display = 'none';
        } else {
            this.control.enabled = false;
            // this.blockerRef.current.style.display = 'block';
            // this.instructionsRef.current.display = 'block';
        }
    };
    pointerlockerror = (event) => {
        this.instructionsRef.current.style.display = '';
    };
    initPointerLock() {
        let instructions = this.instructionsRef.current;
        //实现鼠标锁定的教程地址 http://www.html5rocks.com/en/tutorials/pointerlock/intro/
        var havePointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;
        if (havePointerLock) {
            var element = document.body;
            // 监听变动事件
            document.addEventListener('pointerlockchange', this.pointerlockchange, false);
            document.addEventListener('mozpointerlockchange', this.pointerlockchange, false);
            document.addEventListener('webkitpointerlockchange', this.pointerlockchange, false);
            document.addEventListener('pointerlockerror', this.pointerlockerror, false);
            document.addEventListener('mozpointerlockerror', this.pointerlockerror, false);
            document.addEventListener('webkitpointerlockerror', this.pointerlockerror, false);
            instructions.addEventListener('click', function (event) {
                instructions.style.display = 'none';
                //全屏
                // launchFullScreen(renderer.domElement);
                // 锁定鼠标光标
                element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;
                element.requestPointerLock();
            }, false);
        } else {
            instructions.innerHTML = '你的浏览器不支持相关操作，请更换浏览器';
        }
    }


    createFloor() {
        var geometry = new Three.PlaneGeometry(2000, 2000, 5, 5);
        geometry.applyMatrix(new Three.Matrix4().makeRotationX(-Math.PI / 2));
        var texture = Three.ImageUtils.loadTexture('/texture/desert.jpg');
        texture.wrapS = texture.wrapT = Three.RepeatWrapping;
        texture.repeat.set(64, 64);
        var material = new Three.MeshBasicMaterial({ color: 0x9A9A9A, map: texture });
        return new Three.Mesh(geometry, material);
    }

    componentWillUnmount() {
        this.stop();
        this.modelRef.current.removeChild(this.renderer.domElement);
    }

    render() {
        return (
                <div className="blocker" ref={this.blockerRef} >
                    <div ref={this.instructionsRef} >
                        <span style={{ fontSize: '40px' }} > 点击屏幕开始 </span> <br />
                        <br />
                        (W, A, S, D = 移动, MOUSE = 移动视角)
                    </div>

                <div ref={this.modelRef} >
                </div>

            </div>

        );
    }

    onKeyDown = (e)=> {
        switch (e.keyCode) {
            case 38: // up
            case 87: // w
                this.moveForward = true;
                break;
            case 37: // left
            case 65: // a
                this.moveLeft = true;
                break;
            case 40: // down
            case 83: // s
                this.moveBackward = true;
                break;
            case 39: // right
            case 68: // d
                this.moveRight = true;
                break;
            //   case 32: // space
            //     if (canJump === true) velocity.y += 350;
            //     canJump = false;
            //     break;
        }
    }

    onKeyUp = (e)=> {
        switch (e.keyCode) {
            case 38: // up
            case 87: // w
                this.moveForward = false;
                break;
            case 37: // left
            case 65: // a
                this.moveLeft = false;
                break;
            case 40: // down
            case 83: // s
                this.moveBackward = false;
                break;
            case 39: // right
            case 68: // d
                this.moveRight = false;
                break;
        }
    }

}

export default ModelWidget;
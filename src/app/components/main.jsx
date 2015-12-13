/** In this file, we create a React component which incorporates components provided by material-ui */

import React from 'react';
import RaisedButton from 'material-ui/lib/raised-button';
import Dialog from 'material-ui/lib/dialog';
import ThemeManager from 'material-ui/lib/styles/theme-manager';
import LightRawTheme from 'material-ui/lib/styles/raw-themes/light-raw-theme';
import Colors from 'material-ui/lib/styles/colors';

import MenuItem from 'material-ui/lib/menus/menu-item';
import BottomNav from './bottom-nav';

const containerStyle = {
    textAlign: 'center',
    paddingTop: 200
};

const naviStyle = {
    top: 'auto',
    bottom: 0,
    height: '40%',
    width: '100%'
};

const standardActions = [
    {
        text: 'Okay'
    }
];

const menuItems = [
    {route: 'get-started', text: 'Get Started'},
    {route: 'customization', text: 'Customization'},
    {route: 'components', text: 'Components'},
    //{type: MenuItem.Types.SUBHEADER, text: 'Resources'},
    {
        //type: MenuItem.Types.LINK,
        payload: 'https://github.com/callemall/material-ui',
        text: 'GitHub'
    },
    {
        text: 'Disabled',
        disabled: true
    },
    {
        //type: MenuItem.Types.LINK,
        payload: 'https://www.google.com',
        text: 'Disabled Link',
        disabled: true
    }
];


const Main = React.createClass({

    childContextTypes: {
        muiTheme: React.PropTypes.object
    },

    getInitialState() {
        return {
            muiTheme: ThemeManager.getMuiTheme(LightRawTheme)
        };
    },

    getChildContext() {
        return {
            muiTheme: this.state.muiTheme
        };
    },

    componentWillMount() {
        let newMuiTheme = ThemeManager.modifyRawThemePalette(this.state.muiTheme, {
            accent1Color: Colors.deepOrange500
        });

        this.setState({muiTheme: newMuiTheme});
    },

    _handleRequestClose() {
        this.setState({
            open: false
        });
    },

    _handleTouchTap() {
        this.setState({
            open: true
        });
    },

    _openNavi() {
        console.log("Received touch tap ...");
        this.refs.myNavi.toggle();
    },

    render() {
        return (
            <div style={containerStyle}>

                <BottomNav
                    ref="myNavi"
                    docked={false}
                    style={naviStyle}
                    menuItems={menuItems}/>

                <Dialog
                    open={this.state.open}
                    title="Super Secret Password"
                    actions={standardActions}
                    onRequestClose={this._handleRequestClose}>
                    1-2-3-4-5
                </Dialog>


                <h1>BottomNav</h1>
                <h2>making use of material-ui</h2>
                <RaisedButton
                    label="passwort"
                    primary={true}
                    onTouchTap={this._handleTouchTap}/>
                <RaisedButton
                    label="footer navi"
                    onTouchTap={this._openNavi}/>

            </div>
        );
    }
});

export default Main;

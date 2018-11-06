// Copyright (c) 2018 Eon S. Jeon <esjeon@hyunmu.am>
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the "Software"),
// to deal in the Software without restriction, including without limitation
// the rights to use, copy, modify, merge, publish, distribute, sublicense,
// and/or sell copies of the Software, and to permit persons to whom the
// Software is furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL
// THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
// FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
// DEALINGS IN THE SOFTWARE.

function Screen(id) {
    this.id = id;
    this.layout = layout_tile; //null;
    this.opts = {}
}

function Tile(client) {
    this.client = client;
    this.isNew = true;
    this.isError = false;

    this.x = 0;
    this.y = 0;
    this.width = 0;
    this.height = 0;
}

// TODO: declare Layout class (`layout.js`?)
// TODO: layouts in separate file(s)
function layout_tile(tiles, areaWidth, areaHeight, opts) {
    if(!opts.tile_ratio) opts.tile_ratio = 0.45;
    if(!opts.tile_nmaster) opts.tile_nmaster = 1;

    var masterCount, masterWidth, masterHeight;
    var stackCount , stackWidth, stackHeight, stackX;

    if(tiles.length <= opts.tile_nmaster) {
        masterCount = tiles.length;
        masterWidth = areaWidth;
        masterHeight = Math.floor(areaHeight / masterCount);

        stackCount = stackWidth = stackHeight = stackX = 0;
    } else {
        masterCount = opts.tile_nmaster;
        masterWidth = Math.floor(areaWidth * (1 - opts.tile_ratio));
        masterHeight = Math.floor(areaHeight / masterCount);

        stackCount = tiles.length - masterCount;
        stackWidth = areaWidth - masterWidth;
        stackHeight = Math.floor(areaHeight / stackCount);
        stackX = masterWidth + 1;
    }

    for(var i = 0; i < masterCount; i++) {
        tiles[i].x = 0;
        tiles[i].y = masterHeight * i;
        tiles[i].width = masterWidth;
        tiles[i].height = masterHeight;
    }

    for(var i = 0; i < stackCount; i++) {
        var j = masterCount + i;
        tiles[j].x = stackX;
        tiles[j].y = stackHeight * i;
        tiles[j].width = stackWidth;
        tiles[j].height = stackHeight;
    }
}

function TilingEngine() {
    var self = this;

    self.tiles = Array();
    self.screens = Array();

    self.manage = function(client) {
        if(client.specialWindow)
            return false;

        self.tiles.push(new Tile(client));
        self.arrange();

        return true;
    }

    self.unmanage = function(client) {
        self.tiles = self.tiles
            .filter(function(t) {
                return t.client != client && !t.isError;
            });
        self.arrange();
    }

    self.arrange = function() {
        self.screens.forEach(function(screen) {
            if(screen.layout === null)
                return;

            var desktop = workspace.currentDesktop;

            // TODO: move direct calls to KWin to driver.
            var area = workspace.clientArea(KWin.PlacementArea, screen.id, desktop);
            var visibles = self.tiles
                .filter(function(t) {
                    var c = t.client
                    try {
                        // TODO: test KWin::Toplevel properties...?
                        return (
                            (!c.minimized) &&
                            (c.desktop == desktop || c.desktop == -1) &&
                            (c.screen == screen.id)
                        );
                    } catch(e) {
                        t.isError = true;
                        return false;
                    }
                });
            // TODO: fullscreen handling

            screen.layout(visibles, area.width, area.height, {});

            // TODO: move direct calls to KWin to driver.
            visibles.forEach(function(tile) {
                tile.client.geometry = {
                    x: tile.x,
                    y: tile.y,
                    width: tile.width,
                    height: tile.height,
                }
            });
        });
    }

    self.arrangeClient = function(client) {
        // TODO: move direct calls to KWin to driver.
        self.tiles.forEach(function(tile) {
            if(tile.client != client) return;

            if(client.geometry.x == tile.x)
            if(client.geometry.y == tile.y)
            if(client.geometry.width == tile.width)
            if(client.geometry.height == tile.height)
                return;

            tile.client.geometry = {
                x: tile.x,
                y: tile.y,
                width: tile.width,
                height: tile.height,
            }
        });
    }

    self.addScreen = function(screenId) {
        self.screens.push(new Screen(screenId));
    }

    self.removeScreen = function(screenId) {
        self.screens = self.screens
            .filter(function(screen) {
                return screen.id !== screenId;
            });
    }
}


if (!BS) BS = {};
if (!BS.Kube) BS.Kube = {};

if(!BS.Kube.ProfileSettingsForm) BS.Kube.ProfileSettingsForm = OO.extend(BS.PluginPropertiesForm, {

    testConnectionUrl: '',

    templates: {
        imagesTableRow: $j('<tr class="imagesTableRow">\
<td class="imageName highlight"><div class="sourceIcon sourceIcon_unknown">?</div><span class="imageName"></span></td>\
<td class="dockerImage highlight"></td>\
<td class="maxInstances highlight"></td>\
<td class="edit highlight"><span class="editVmImageLink_disabled" title="Editing is available after successful retrieval of data">edit</span><a href="#" class="editVmImageLink hidden">edit</a></td>\
<td class="remove"><a href="#" class="removeVmImageLink">delete</a></td>\
        </tr>')},

    _dataKeys: [ 'dockerImage', 'pool', 'maxInstances' ],

    selectors: {
        rmImageLink: '.removeVmImageLink',
        editImageLink: '.editVmImageLink',
        imagesTableRow: '.imagesTableRow'
    },

    initialize: function(){
        this.$imagesTable = $j('#kubeImagesTable');
        this.$showAddImageDialogButton = $j('#showAddImageDialogButton');
        this.$addImageButton = $j('#kubeAddImageButton');
        this.$cancelAddImageButton = $j('#kubeCancelAddImageButton');
        this.$emptyImagesListMessage = $j('.emptyImagesListMessage');
        this.$imagesTableWrapper = $j('.imagesTableWrapper');

        this.$imagesDataElem = $j('#' + 'source_images_json');
        var rawImagesData = this.$imagesDataElem.val() || '[]';
        try {
            this.imagesData = JSON.parse(rawImagesData);
        } catch (e) {
            this.imagesData = [];
            BS.Log.error('bad images data: ' + rawImagesData);
        }
        this._lastImageId = this._imagesDataLength = 0;

        this._bindHandlers();
        this._renderImagesTable();
        this.$addImageButton.removeAttr('disabled');
        BS.Clouds.Admin.CreateProfileForm.checkIfModified();
    },

    _bindHandlers: function () {
        var self = this;

        //// Click Handlers
        this.$showAddImageDialogButton.on('click', this._showDialogClickHandler.bind(this));
        this.$addImageButton.on('click', this._submitDialogClickHandler.bind(this));
        this.$cancelAddImageButton.on('click', this._cancelDialogClickHandler.bind(this));
        this.$imagesTable.on('click', this.selectors.rmImageLink, function () {
            var $this = $j(this),
                id = $this.data('image-id'),
                name = self.imagesData[id].dockerImage;

            if (confirm('Are you sure you want to remove the image "' + name + '"?')) {
                self.removeImage($this);
            }
            return false;
        });
        var editDelegates = this.selectors.imagesTableRow + ' .highlight, ' + this.selectors.editImageLink;
        var that = this;
        this.$imagesTable.on('click', editDelegates, function () {
            if (!that.$addImageButton.prop('disabled')) {
                self.showEditImageDialog($j(this));
            }
            return false;
        });
    },

    _showDialogClickHandler: function () {
        if (! this.$showAddImageDialogButton.attr('disabled')) {
            this.showAddImageDialog();
        }
        return false;
    },

    _cancelDialogClickHandler: function () {
        BS.Kube.ImageDialog.close();
        return false;
    },

    _submitDialogClickHandler: function() {
        if (this.validateOptions()) {
            if (this.$addImageButton.val().toLowerCase() === 'save') {
                this.editImage(this.$addImageButton.data('image-id'));
            } else {
                this.addImage();
            }
            this.validateImages();
            BS.Kube.ImageDialog.close();
        }
        return false;
    },

    _renderImagesTable: function () {
        this._clearImagesTable();

        if (this._imagesDataLength) {
            Object.keys(this.imagesData).forEach(function (imageId) {
                var src = this.data[imageId]['source-id'];
                $j('#initial_images_list').val($j('#initial_images_list').val() + src + ",");
                this._renderImageRow(this.data[imageId], imageId);
            }.bind(this));
        }
    },

    _renderImageRow: function (props, id) {
        var $row = this.templates.imagesTableRow.clone().attr('data-image-id', id);

        this._dataKeys.forEach(function (className) {
            $row.find('.' + className).text(props[className]);
        });

        $row.find(this.selectors.rmImageLink).data('image-id', id);
        $row.find(this.selectors.editImageLink).data('image-id', id);
        this.$imagesTable.append($row);
    },

    _clearImagesTable: function () {
        this.$imagesTable.find('.imagesTableRow').remove();
    },

    _toggleImagesTable: function () {
        var toggle = !!this._imagesDataLength;
        this.$imagesTableWrapper.removeClass('hidden');
        this.$emptyImagesListMessage.toggleClass('hidden', toggle);
        this.$imagesTable.toggleClass('hidden', !toggle);
    },

    validateOptions: function (options){
        //TODO: implement
        return true;
    },

    validateImages: function (){
        //TODO: implement
        return true;
    },

    testConnection: function() {
        BS.ajaxRequest(this.testConnectionUrl, {
            parameters: BS.Clouds.Admin.CreateProfileForm.serializeParameters(),
            onFailure: function (response) {
                BS.TestConnectionDialog.show(false, response, null);
            }.bind(this),
            onSuccess: function (response) {
                var wereErrors = BS.XMLResponse.processErrors(response.responseXML, {
                    onConnectionError: function(elem) {
                        BS.TestConnectionDialog.show(false, elem.firstChild.nodeValue, null);
                    }
                }, BS.PluginPropertiesForm.propertiesErrorsHandler);
                if(!wereErrors){
                    BS.TestConnectionDialog.show(true, "", null);
                }
            }.bind(this)
        });
    },

    showAddImageDialog: function () {
        $j('#KubeImageDialogTitle').text('Add Kubernetes Cloud Image');

        //TODO: enable this
        // BS.Hider.addHideFunction('KubeImageDialog', this.resetDataAndDialog.bind(this));

        this._image = {
            maxInstances: 1
        };

        BS.Kube.ImageDialog.showCentered();
    },

    showEditImageDialog: function ($elem) {
        var imageId = $elem.parents(this.selectors.imagesTableRow).data('image-id');

        $j('#KubeImageDialogTitle').text('Edit Kubernetes Cloud Image');

        //TODO: enable this
        // BS.Hider.addHideFunction('KubeImageDialog', this.resetDataAndDialog.bind(this));

        typeof imageId !== 'undefined' && (this._image = $j.extend({}, this.imagesData[imageId]));
        this.$addImageButton.val('Edit').data('image-id', imageId);
        if (imageId === 'undefined'){
            this.$addImageButton.removeData('image-id');
        }

        BS.Kube.ImageDialog.showCentered();
    },

    addImage: function () {
        var newImageId = this._lastImageId++,
            newImage = this._image;
        this._renderImageRow(newImage, newImageId);
        this.imagesData[newImageId] = newImage;
        this._imagesDataLength += 1;
        this.saveImagesData();
        this._toggleImagesTable();
    },

    editImage: function (id) {
        this.setupSourceId(this._image);
        this.imagesData[id] = this._image;
        this.saveImagesData();
        this.$imagesTable.find(this.selectors.imagesTableRow).remove();
        this._renderImagesTable();
    },

    removeImage: function ($elem) {
        delete this.imagesData[$elem.data('image-id')];
        this._imagesDataLength -= 1;
        $elem.parents(this.selectors.imagesTableRow).remove();
        this.saveImagesData();
        this._toggleImagesTable();
    },

    saveImagesData: function () {
        var imageData = Object.keys(this.imagesData).reduce(function (accumulator, id) {
            var _val = $j.extend({}, this.imagesData[id]);

            delete _val.$image;
            accumulator.push(_val);

            return accumulator;
        }.bind(this), []);

        this.$imagesDataElem.val(JSON.stringify(imageData));
    }
});

if(!BS.Kube.ImageDialog) BS.Kube.ImageDialog = OO.extend(BS.AbstractModalDialog, {
    getContainer: function() {
        return $('KubeImageDialog');
    }
});
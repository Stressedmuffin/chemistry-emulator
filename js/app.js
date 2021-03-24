
var fontSize = 10, logecFontSize = 10, desktopGridW = 40, desktopGridH = 30, desktopGridItemSize = 2.4, initPRWI = null, initPRWIF = true, specialKeyboardSigns = ['<', '>', '/', '=', '+', '-', '×', 'fraction']; 
if (!String.prototype.startsWith) {
    Object.defineProperty(String.prototype, 'startsWith', {
        value: function (search, rawPos) {
            var pos = rawPos > 0 ? rawPos | 0 : 0;
            return this.substring(pos, pos + search.length) === search;
        }
    });
}
(function ($) {
    $.fn.hasScrollBar = function () {
        return this.get(0).scrollHeight > this.height();
    }
})(jQuery);
var fakeEl = $('<span style="white-space:pre;pointer-events: none;position: absolute;opacity: 0;left: 0; top:0;"></span>');
var isIe = function () {
    var ua = window.navigator.userAgent;
    var trident = ua.indexOf('Trident/');
    if (trident > 0) {
        // IE 11 => return version number
        var rv = ua.indexOf('rv:');
        return parseInt(ua.substring(rv + 3, ua.indexOf('.', rv)), 10);
    }
}

$.fn.getTextWidth = function (text, font) {
    $('body').append(fakeEl);
    var t = (text || this.val() || this.text() || this.attr('placeholder') || "");
    fakeEl.html(t);//.css('font', font || this.css('font'));
    if (font) {
        fakeEl.css('font', font || this.css('font'));
    }
    else {
        fakeEl.css({ 'font-family': this.css('font-family'), 'font-size': this.css('font-size') });
    }
    return fakeEl.width();
};
$.fn.setInputTextSize = function (emOn) {
    this.on('input change', function () {
        var width = $(this).getTextWidth();
        if (width < 10) {
            width = 10;
        }
        if (emOn) {
            var fs = parseFloat($(this).css('font-size'));
            width /= fs;
            width += 'em';
        }
        $(this).css('width', width);
    });
    var width = this.getTextWidth();
    if (width < 10) {
        width = 10;
    }
    if (emOn) {
        var fs = parseFloat(this.css('font-size'));
        width /= fs;
        width += 'em';
    }
    this.css('width', width);
};
$.fn.getInputSize = function () {
    var text = this.val() || this.text() || this.attr('placeholder');
    var size = text.length;
    if (size < 1) {
        size = 1;
    }
};
$.fn.setInputAutoSize = function () {
    this.on('input', function () {
        $(this).attr('size', $(this).getInputSize());
    });
    this.attr('size', this.getInputSize());
};

var App = function () {
    var chemicalGeneratorContainer, dom, options;
    var state;
    var selectedTab = "";
    var protectUp = false;
    var initOxidationDataTemp = [];
    var chemicalProcesCopy;
    var oxidationIndex = 0;
    var deleteStatus = false;
    var is_enable;
    var showSaveBtn;
    var defultState;
    const ARROW_HEIGHT = 13.72;

    if (isIe()) {
        $('body').addClass('isIE');
    }

    var init = function (_options) {
        options = _options;
        //setPrisetData(); now from  init_iTestAssetController();
        createHtml();

        initchemicalProcess();

        initcalcTable();

        options.container.append(chemicalGeneratorContainer);

        chemicalGeneratorContainer.find('.ChemicalGenerator-desktop_layer-container .ChemicalGenerator-desktop_chemicalProces:not(.calcTableElement)').map(function () {
            setProcessDraggable($(this));
        });

        chemicalGeneratorContainer.find('.ChemicalGenerator-desktop_layer-tools .ChemicalGenerator-desktop_keyboard').draggable({
            //containment: chemicalGeneratorContainer.find('.ChemicalGenerator-desktop'),
            cancel: '.ChemicalGenerator-desktop_keyboard-btn',
            stop: function (event, ui) {
                var p = 70;
                var top = (ui.position.top / fontSize);
                var left = (ui.position.left / fontSize);
                var w = $(this).outerWidth() / fontSize;
                var h = $(this).outerHeight() / fontSize;
                var cw = chemicalGeneratorContainer.find('.ChemicalGenerator-desktop').width() / fontSize;
                var ch = chemicalGeneratorContainer.find('.ChemicalGenerator-desktop').height() / fontSize;

                if (top < -h * p / 100) {
                    top = -h * p / 100;
                }
                else if (top > ch - (h * (100 - p) / 100)) {
                    top = ch - (h * (100 - p) / 100);
                }

                if (left < -w * p / 100) {
                    left = -w * p / 100;
                }
                else if (left > cw - (w * (100 - p) / 100)) {
                    left = cw - (w * (100 - p) / 100);
                }

                $(this).animate({
                    top: top + 'em',
                    left: left + 'em'
                });
            }
        });
        chemicalGeneratorContainer.on('click', function () {
            if (!protectUp) {
                chemicalGeneratorContainer.find('.ChemicalGenerator-desktop_degreesOfOxidation--can_resize').removeClass('ChemicalGenerator-desktop_degreesOfOxidation--can_resize');
            }
            protectUp = false;
        });
        chemicalGeneratorContainer.on('click', '.ChemicalGenerator-desktop_degreesOfOxidations', function (e) {
            e.stopPropagation();
            protectUp = false;
        });

        chemicalGeneratorContainer.find('.ChemicalGenerator-tools .ChemicalGenerator-tools-tabs .ChemicalGenerator-tools-tab[data-tab-id="representationFormulas"] .ChemicalGenerator-tools-tab-representationFormulas_menu .ChemicalGenerator-desktop_representationFormula-menu_item').draggable({
            cursorAt: [0, 0],
            helper: function (event) {
                var helper = $(this).find('.ChemicalGenerator-desktop_representationFormula-item').first().clone();
                helper.css('transform', '');
                chemicalGeneratorContainer.find('.ChemicalGenerator-desktop .ChemicalGenerator-desktop_layer--representationFormulas').append(helper);
                return helper;
            },
            start: function (event, ui) {
                if ($(this).is('[firstRun]')) {
                    $(this).draggable('option', 'cursorAt', {
                        left: Math.floor((ui.helper.width() - fontSize) / 2),
                        top: Math.floor((ui.helper.height() - fontSize) / 2)
                    });
                }
            },
            drag: function (evt, ui) {
                if ($(this).is('[firstRun]')) {
                    ui.position.left -= Math.floor((ui.helper.width() - fontSize) / 2);
                    ui.position.top -= Math.floor((ui.helper.height() - fontSize) / 2);
                }
            },
            stop: function (event, ui) {
                var contaner = chemicalGeneratorContainer.find('.ChemicalGenerator-desktop .ChemicalGenerator-desktop_layer--representationFormulas');
                var helper = ui.helper.clone();
                var x = parseInt(ui.position.left / desktopGridItemSize / fontSize) * desktopGridItemSize;
                var y = parseInt(ui.position.top / desktopGridItemSize / fontSize) * desktopGridItemSize;
                helper.removeClass('ui-draggable-dragging');
                contaner.append(helper);
                var initDraggable = function (item) {
                    item.addClass('can_trash');
                    item.draggable({
                        stop: function (event, ui) {
                            var x = parseInt(ui.position.left / desktopGridItemSize / fontSize) * desktopGridItemSize;
                            var y = parseInt(ui.position.top / desktopGridItemSize / fontSize) * desktopGridItemSize;
                            $(this).animate({
                                left: x + 'em',
                                top: y + 'em'
                            });

                        }
                    });
                };
                initDraggable(helper);
                if (helper.is('[item-type="group"]')) {
                    helper.find('.ChemicalGenerator-desktop_representationFormula-item').map(function () {
                        initDraggable($(this));
                    });
                }
                helper.animate({
                    left: x + 'em',
                    top: y + 'em'
                });
                if ($(this).is('[firstRun]')) {
                    $(this).removeAttr('firstRun');
                }

                //if (helper.is('[item-type="group"]')) {
                //  helper.find('.ChemicalGenerator-desktop_representationFormula-item').map(function () {
                //    $(this).css({
                //      left: (x + Number($(this).attr('data-x'))) + 'em',
                //      top: (y + Number($(this).attr('data-y'))) + 'em'
                //    });
                //    $(this).removeAttr('data-x');
                //    $(this).removeAttr('data-y');
                //    contaner.append($(this));
                //  });
                //}
            }
        });

        chemicalGeneratorContainer.on('click', '.ChemicalGenerator-tools .ChemicalGenerator-tools-tabs .ChemicalGenerator-tools-tab', function () {
            if (!$(this).is('.ChemicalGenerator-tools-tab--selected')) {
                unSelectProcess();
                deleteStatus = false;
                $('.ChemicalGenerator-desktop_chemicalProces-segment').removeClass('ChemicalGenerator-desktop_Delete');
                selectedTab = $(this).attr('data-tab-id');
                chemicalGeneratorContainer.attr('data-tab-container', selectedTab);
                $('.ChemicalGenerator-desktop_keyboard_type--selected').removeClass('ChemicalGenerator-desktop_keyboard_type--selected');
                if (selectedTab == 'chemicalProcess') {
                    // enable \ disable relevant buttons in keyboard
                    $('#keyboard_data_delete_btn').attr('disabled', '');
                    $('#keyboard_dashed_btn').attr('disabled', '');
                    $('#keyboard_up_arrow_btn').attr('disabled', '');
                    $('#keyboard_e-_btn').removeAttr('disabled');

                    $('.ChemicalGenerator-desktop_keyboard_type[data-tab-id="chemicalProcess"]').click();
                    chemicalGeneratorContainer.find('.ChemicalGenerator-desktop_EnergyGraph').remove();

                }
                else if (selectedTab == 'calcTable') {
                    chemicalGeneratorContainer.find('.ChemicalGenerator-desktop_EnergyGraph').remove();
                    var table = chemicalGeneratorContainer.find('.calcTableTbl');
                    if (table.length>0) {
                        setTableWidthScrollbar(table);
                    }
                }
                else if (selectedTab == 'HessLaw') {
                    // enable \ disable relevant buttons in keyboard
                    $('#keyboard_data_delete_btn').removeAttr('disabled');
                    $('#keyboard_dashed_btn').removeAttr('disabled');
                    $('#keyboard_up_arrow_btn').attr('disabled', '');
                    $('#keyboard_e-_btn').attr('disabled', '');

                    $('.ChemicalGenerator-desktop_keyboard_type[data-tab-id="HessLaw"]').click();
                    chemicalGeneratorContainer.find('.ChemicalGenerator-desktop_EnergyGraph').remove();
                }
                else if (selectedTab == 'EnergyGraph') {
                    // enable \ disable relevant buttons in keyboard
                    $('#keyboard_data_delete_btn').attr('disabled', '');
                    $('#keyboard_dashed_btn').removeAttr('disabled');
                    $('#keyboard_up_arrow_btn').removeAttr('disabled');
                    $('#keyboard_e-_btn').attr('disabled', '');

                    $('.ChemicalGenerator-desktop_keyboard_type[data-tab-id="EnergyGraph"]').click();
                    chemicalGeneratorContainer.find('.ChemicalGenerator-desktop_layer-container').append('<div class="ChemicalGenerator-desktop_EnergyGraph"></div>');

                }

                $(this).addClass('ChemicalGenerator-tools-tab--selected');
                $(this).siblings().removeClass('ChemicalGenerator-tools-tab--selected');
            }
        });

        selectedTab = state.startTab;
        if (selectedTab) {
            $("div[data-tab-id='" + selectedTab + "']").click();
        }

        chemicalGeneratorContainer.find('.ChemicalGenerator-tools .ChemicalGenerator-tools-tabs .ChemicalGenerator-tools-tab[data-tab-id="' + selectedTab + '"]').addClass('ChemicalGenerator-tools-tab--selected');
        chemicalGeneratorContainer.attr('data-tab-container', selectedTab);        


        onAppResize(true);
        registerEvents();

        if (initPRWIF && initOxidationDataTemp.length > 0) {
            var getPRW = function () {
                var w = 0;
                chemicalGeneratorContainer.find('.ChemicalGenerator-desktop_layer--chemicalProcess .ChemicalGenerator-desktop_chemicalProces').map(function () {
                    w += $(this).outerWidth();
                });
                //console.log(w, chemicalGeneratorContainer.outerWidth());
                return w;
            };
            var w = getPRW();
            var wc = 0;
            initPRWI = setInterval(function () {
                var _w = getPRW();
                if (w == _w) {
                    wc++;
                }
                else {
                    wc = 0;
                }

                if (wc >= 3) {
                    clearInterval(initPRWI);
                    initPRWI = null;
                    initPRWIF = false;
                    for (var i = 0; i < initOxidationDataTemp.length; i++) {
                        var currentOxidation = initOxidationDataTemp[i];
                        if (currentOxidation.extraoxidation) {
                            addExtraOxidation(currentOxidation);
                        }
                        setDegreesOfOxidationPosition(currentOxidation.oxidation, false);
                        currentOxidation.oxidation.children('.ChemicalGenerator-desktop_degreesOfOxidation-input').find('input').setInputTextSize(true);
                    }
                    initOxidationDataTemp = [];
                    setTimeout(function () {
                        options.container.animate(
                            {
                                opacity: 1
                            },
                            500
                        );
                    }, 10);
                }
                else {
                    w = _w;
                }
            }, 250);
        }
        else {
            for (var i = 0; i < initOxidationDataTemp.length; i++) {
                var currentOxidation = initOxidationDataTemp[i];
                if (initOxidationDataTemp[i].extraoxidation) {
                    addExtraOxidation(currentOxidation);
                }
                currentOxidation.oxidation.children('.ChemicalGenerator-desktop_degreesOfOxidation-input').find('input').setInputTextSize(true);
            }
            initOxidationDataTemp = [];

            options.container.animate(
                {
                    opacity: 1
                },
                500
            );
        }
        listenToMode_callback(is_enable);
        if (state.debugMode != 'undefined' && state.debugMode == 1) {
            is_enable = true;
            listenToMode_callback(true);
        }

        initHessLaw();

        initEnergyGraph();
    };

    var setPrisetData = function () {
        state = JSON.parse(JSON.stringify(AppPriset));
    };

    var trashAnimate = function () {
        var trash = chemicalGeneratorContainer.find('.ChemicalGenerator-tools-trash');
        if (trash.is('.trash')) {
            return;
        }
        trash.addClass('trash');
        setTimeout(function () { trash.removeClass('trash'); }, 500);
        setProcesLayerFade();
    };

    var deleteDegreeOfOxidation = function (degreesOfOxidation, e) {
        trashAnimate();
        var oxidationindex = degreesOfOxidation.attr('data-oxidationindex');
        var extraOxidation = e != false ? $(e.target).closest('.ChemicalGenerator-desktop_degreesOfOxidation_extra') : null;
        if (extraOxidation != null && extraOxidation.length > 0) // delete from extra
        {
            degreesOfOxidation.removeAttr('extra_oxidation');
            degreesOfOxidation.closest('.ChemicalGenerator-desktop_chemicalProces').find('.ChemicalGenerator-desktop_chemicalProces-segment[data-oxidationextraindex="' + oxidationindex + '"]').removeAttr('data-oxidationextraindex');
            extraOxidation.remove();
        }
        else if (typeof (degreesOfOxidation.attr('extra_oxidation')) != 'undefined') //delete from main and has extra
        {
            //copyData 
            copyDataFromExtraOxidationToMain(degreesOfOxidation);
            //remove extra
            degreesOfOxidation.removeAttr('extra_oxidation');
            degreesOfOxidation.find('.ChemicalGenerator-desktop_degreesOfOxidation_extra').remove();
            degreesOfOxidation.removeClass('ChemicalGenerator-desktop_degreesOfOxidation--can_resize');
        }
        else // delete from main doesn't have extra
        {
            degreesOfOxidation.closest('.ChemicalGenerator-desktop_chemicalProces').find('.ChemicalGenerator-desktop_chemicalProces-segment[data-oxidationindex="' + oxidationindex + '"]').removeAttr('data-oxidationindex');
            degreesOfOxidation.remove();
        }
    }

    var confirmMassege = function (title, massege, okText, cancelText, onOk, onCancel, options) {
        var box = '<div class="ChemicalGeneratorContainer-ConfirmMassege">\
                <div class="ChemicalGeneratorContainer-ConfirmMassege-contaner">\
                  <div class="ChemicalGeneratorContainer-ConfirmMassege-cancel"></div>\
                  <div class="ChemicalGeneratorContainer-ConfirmMassege-title"><span></span></div>\
                  <div class="ChemicalGeneratorContainer-ConfirmMassege-massege"><span></span></div>\
                  <div class="ChemicalGeneratorContainer-ConfirmMassege-footer">\
                    <div class="ChemicalGeneratorContainer-ConfirmMassege-footer-btn ChemicalGeneratorContainer-ConfirmMassege-footer-btn--ok"><span></span></div>\
                    <div class="ChemicalGeneratorContainer-ConfirmMassege-footer-btn ChemicalGeneratorContainer-ConfirmMassege-footer-btn--cancel"><span></span></div>\
                  </div>\
                </div>\
              </div>';
        box = $(box);

        box.find('.ChemicalGeneratorContainer-ConfirmMassege-title span').html(title);
        box.find('.ChemicalGeneratorContainer-ConfirmMassege-massege span').html(massege);
        if (okText != '') {
            box.find('.ChemicalGeneratorContainer-ConfirmMassege-footer-btn--ok span').html(okText);
            box.find('.ChemicalGeneratorContainer-ConfirmMassege-footer-btn--ok').css('display', 'inline-block');
        }
        else {
            box.find('.ChemicalGeneratorContainer-ConfirmMassege-footer-btn--ok').css('display', 'none');
        }
        if (cancelText != '') {
            box.find('.ChemicalGeneratorContainer-ConfirmMassege-footer-btn--cancel span').html(cancelText);
            box.find('.ChemicalGeneratorContainer-ConfirmMassege-footer-btn--cancel').css('display','inline-block');
        }
        else {
            box.find('.ChemicalGeneratorContainer-ConfirmMassege-footer-btn--cancel').css('display', 'none');
        }



        box.on('click', '.ChemicalGeneratorContainer-ConfirmMassege-footer-btn--ok', function () {
            box.remove();
            if (onOk) {
                onOk();
            }
        });

        box.on('click', '.ChemicalGeneratorContainer-ConfirmMassege-footer-btn--cancel, .ChemicalGeneratorContainer-ConfirmMassege-cancel', function () {
            box.remove();
            if (onCancel) {
                onCancel();
            }
        });

        if (options) {

        }

        chemicalGeneratorContainer.append(box);
    };

    var createHtml = function () {
        chemicalGeneratorContainer = document.getElementById("MainContainer");

        chemicalGeneratorContainer = $(chemicalGeneratorContainer);
        chemicalGeneratorContainer.attr('data-direction', cet.translations.direction);
        chemicalGeneratorContainer.attr('data-lang', cet.translations.lang);

        if (state.representationFormulas.enable) {
            chemicalGeneratorContainer.find('.ChemicalGenerator-tools .ChemicalGenerator-tools-tabs').append('<div class="ChemicalGenerator-tools-tab" data-tab-id="representationFormulas"><span>' + cet.translations.representationFormulas + '</span></div>');
        }
        if (state.chemicalProcess.enable) {
            chemicalGeneratorContainer.find('.ChemicalGenerator-tools .ChemicalGenerator-tools-tabs')
                .append('<div class="ChemicalGenerator-tools-tab" data-tab-id="chemicalProcess"><span>' + cet.translations.chemicalProcess + '<div>' + cet.translations.degreesOfOxidation + '</div></span></div>');
            chemicalGeneratorContainer.find('.ChemicalGenerator-tools')
                .append('<div class="ChemicalGenerator-desktop_keyboard_type_toolbar">\
                    <div class="ChemicalGenerator-desktop_keyboard_type" data-tab-id="chemicalProcess" main-data-tab-id="chemicalProcess"><span>' + cet.translations.show_keyboard + '</span></div>\
                    <div class="ChemicalGenerator-desktop_keyboard_type" data-tab-id="degreesOfOxidation" main-data-tab-id="chemicalProcess"><span>' + cet.translations.show_chain + '</span></div>\
                    <div class="ChemicalGenerator-desktop_keyboard_type" data-tab-id="degreeOfOxidation"  main-data-tab-id="chemicalProcess"><span>' + cet.translations.show_circle + '</span></div>\
                    <div class="ChemicalGenerator-tools-trash"><span>' + cet.translations.trash_all_ok + '</span><div class="icon"></div></div>\
       </div>');
        }

        if (state.calcTable.enable) {
            CreateTabToolbar(chemicalGeneratorContainer, "calcTable");
        }
        if (state.HessLaw.enable) {
            CreateTabToolbar(chemicalGeneratorContainer, "HessLaw");
        }
        if (state.EnergyGraph.enable) {
            CreateTabToolbar(chemicalGeneratorContainer, "EnergyGraph");
        }

        chemicalGeneratorContainer.on('click', '.ChemicalGenerator-tools .ChemicalGenerator-desktop_keyboard_type_toolbar .ChemicalGenerator-desktop_keyboard_type', function () {
            setSelectedTabToolbar($(this),"");
        });

        //chemicalGeneratorContainer.on('click', '.ChemicalGenerator-tools .ChemicalGenerator-desktop_HessLaw_keyboard_type_toolbar .ChemicalGenerator-desktop_HessLaw_keyboard_type', function () {
        //    if ($(this).is('.ChemicalGenerator-desktop_HessLaw_keyboard_type--selected')) {
        //        return;
        //    }
        //    unSelectProcess();
        //    selectedTab = $(this).attr('data-tab-id');
        //    chemicalGeneratorContainer.attr('data-tab-container', selectedTab);
        //    $(this).addClass('ChemicalGenerator-desktop_HessLaw_keyboard_type--selected');
        //    $(this).siblings().removeClass('ChemicalGenerator-desktop_HessLaw_keyboard_type--selected');
        //    //  setSelectedTabToolbar($(this),"HessLaw");
        //});

        //chemicalGeneratorContainer.on('click', '.ChemicalGenerator-tools .ChemicalGenerator-desktop_EnergyGraph_keyboard_type_toolbar .ChemicalGenerator-desktop_EnergyGraph_keyboard_type', function () {
        //    if ($(this).is('.ChemicalGenerator-desktop_EnergyGraph_keyboard_type--selected')) {
        //        return;
        //    }
        //    unSelectProcess();
        //    selectedTab = $(this).attr('data-tab-id');
        //    chemicalGeneratorContainer.attr('data-tab-container', selectedTab);
        //    $(this).addClass('ChemicalGenerator-desktop_EnergyGraph_keyboard_type--selected');
        //    $(this).siblings().removeClass('ChemicalGenerator-desktop_EnergyGraph_keyboard_type--selected');
        //    //setSelectedTabToolbar($(this), "EnergyGraph");
        //});

        chemicalGeneratorContainer.on('click', '.ChemicalGenerator-tools .ChemicalGenerator-tools-trash', function () {
            confirmMassege(cet.translations.trash_all_title,
                cet.translations.trash_all_massege,
                cet.translations.trash_all_ok,
                cet.translations.trash_all_cancel,
                function () {
                    $('.ChemicalGenerator-startover_masseg-btn--ok').first().click();
                },
                function () {
                    //trashAnimate();
                },
                {});


        });
        chemicalGeneratorContainer.find('.ChemicalGenerator-tools .ChemicalGenerator-tools-trash').droppable({
            accept: ".can_trash",
            tolerance: 'pointer',
            over: function (event, ui) { $(this).addClass('ui-droppable-hover'); },
            out: function (event, ui) { $(this).removeClass('ui-droppable-hover'); },
            drop: function (event, ui) {
                ui.draggable.addClass('isrevert');
                ui.draggable.remove();
                if (ui.draggable.is('.ChemicalGenerator-desktop_chemicalProces--selected')) {
                    unSelectProcess();
                }
                trashAnimate();
                $(this).removeClass('ui-droppable-hover');

                //if (confirm('Are you sure you want to save this thing into the database?')) {

                //}
            }
        });

        chemicalGeneratorContainer.find('.ChemicalGenerator-desktop-grid_swicher .ChemicalGenerator-desktop-grid_slider').click(function () {
            chemicalGeneratorContainer.toggleClass('ChemicalGeneratorContainer--show_grid');
        });

        chemicalGeneratorContainer.find('.ChemicalGenerator-startover_masseg .ChemicalGenerator-startover_masseg-close').attr('title', options.translations.close);
        chemicalGeneratorContainer.find('.ChemicalGenerator-startover_masseg .ChemicalGenerator-startover_masseg-btn--ok span').html(options.translations.yes);
        chemicalGeneratorContainer.find('.ChemicalGenerator-startover_masseg .ChemicalGenerator-startover_masseg-btn--no span').html(options.translations.no);
        chemicalGeneratorContainer.find('.ChemicalGenerator-startover_masseg .ChemicalGenerator-startover_masseg-content--title span').html(options.translations.startoverTitle);
        chemicalGeneratorContainer.find('.ChemicalGenerator-startover_masseg .ChemicalGenerator-startover_masseg-content--text span').html(options.translations.startoverMasseg);

        if (showSaveBtn) {
            var saveContainer = '<div class="ChemicalGenerator-desktop_save_container">\
                <div class="ChemicalGenerator-desktop_save_btn"><span>'+ options.translations.save + '</span></div>\
                <span class="ChemicalGenerator-desktop_save_message"></span>\
            </div>';
            chemicalGeneratorContainer.find('.ChemicalGenerator-desktop').append(saveContainer);
            chemicalGeneratorContainer.on('click', '.ChemicalGenerator-desktop_save_btn', function () {
                saveState();
                $(this).parent('.ChemicalGenerator-desktop_save_container').find('.ChemicalGenerator-desktop_save_message').html(options.translations.savedSuccess).show();
                setTimeout(function () {
                    $(".ChemicalGenerator-desktop_save_message").hide();
                }, 2000);
            });
        }

    };
    function setSelectedTabToolbar(element, tab) {
        tab = tab!=""?(tab + "_"):tab;
        if (element.is('.ChemicalGenerator-desktop_' + tab + 'keyboard_type--selected')) {
            return;
        }
        unSelectProcess();
        selectedTab = element.attr('data-tab-id');
        chemicalGeneratorContainer.attr('data-tab-container', selectedTab);
        element.addClass('ChemicalGenerator-desktop_' + tab + 'keyboard_type--selected');
        element.siblings().removeClass('ChemicalGenerator-desktop_' + tab + 'keyboard_type--selected');
    }
    function CreateTabToolbar(chemicalGeneratorContainer, tabTitle) {

        chemicalGeneratorContainer.find('.ChemicalGenerator-tools .ChemicalGenerator-tools-tabs')
            .append('<div class="ChemicalGenerator-tools-tab" data-tab-id="' + tabTitle + '"><span>' + cet.translations[tabTitle] + '</span></div>');
        chemicalGeneratorContainer.find('.ChemicalGenerator-tools')
            .append('<div class="ChemicalGenerator-desktop_' + tabTitle + '_keyboard_type_toolbar">\
                    <div class="ChemicalGenerator-desktop_keyboard_type" data-tab-id="chemicalProcess" main-data-tab-id="chemicalProcess"><span>' + cet.translations.show_keyboard + '</span></div>\
                    <div class="ChemicalGenerator-tools-trash"><span>' + cet.translations.trash_all_ok + '</span><div class="icon"></div></div>\
        </div > ');
    }
    var listenToMode_callback = function (mode) {
        is_enable = mode;
        if (is_enable) {
            chemicalGeneratorContainer.removeAttr("data-disabled");
        } else {
            chemicalGeneratorContainer.attr("data-disabled", "true");
        }
    };
    // #region chemicalProcess
    var unSelectProcess = function () { };
    var initchemicalProcess = function () {
        var dom = '<div class="ChemicalGenerator-desktop_layer-container"></div>' +
            '<div class="ChemicalGenerator-desktop_layer-tools">\
                <div class="ChemicalGenerator-desktop_keyboard">\
                  <div class="ChemicalGenerator-desktop_keyboard-toggle-sizeBtn calc-table-btn"></div>\
                  <div class="ChemicalGenerator-desktop_keyboard-closeBtn"></div>\
                  <div class="ChemicalGenerator-desktop_keyboard-section"></div>\
                  <div class="ChemicalGenerator-desktop_keyboard-section ChemicalGenerator-desktop_keyboard-section-calc-table" data-grid="4">\
                      <div class="ChemicalGenerator-desktop_keyboard-btn ChemicalGenerator-desktop_keyboard-btn--color" data-input-bottom="segment" data-input-top="segment" data-input-center="fragment" data-input="7"><span>7</span></div>\
                      <div class="ChemicalGenerator-desktop_keyboard-btn ChemicalGenerator-desktop_keyboard-btn--color" data-input-bottom="segment" data-input-top="segment" data-input-center="fragment" data-input="8"><span>8</span></div>\
                      <div class="ChemicalGenerator-desktop_keyboard-btn ChemicalGenerator-desktop_keyboard-btn--color" data-input-bottom="segment" data-input-top="segment" data-input-center="fragment" data-input="9"><span>9</span></div>\
                      <div class="ChemicalGenerator-desktop_keyboard-btn ChemicalGenerator-desktop_keyboard-btn--color" data-input-fragment="fraction" ></div>\
                      <div class="ChemicalGenerator-desktop_keyboard-btn ChemicalGenerator-desktop_keyboard-btn--color" data-input-bottom="segment" data-input-top="segment" data-input-center="fragment" data-input="4"><span>4</span></div>\
                      <div class="ChemicalGenerator-desktop_keyboard-btn ChemicalGenerator-desktop_keyboard-btn--color" data-input-bottom="segment" data-input-top="segment" data-input-center="fragment" data-input="5"><span>5</span></div>\
                      <div class="ChemicalGenerator-desktop_keyboard-btn ChemicalGenerator-desktop_keyboard-btn--color" data-input-bottom="segment" data-input-top="segment" data-input-center="fragment" data-input="6"><span>6</span></div>\
                      <div class="ChemicalGenerator-desktop_keyboard-btn ChemicalGenerator-desktop_keyboard-btn--color" data-input-bottom="segment" data-input-top="segment" data-input-center="fragment" data-input="."> <span>.</span></div>\
                      <div class="ChemicalGenerator-desktop_keyboard-btn ChemicalGenerator-desktop_keyboard-btn--color" data-input-bottom="segment" data-input-top="segment" data-input-center="fragment" data-input="1"><span>1</span></div>\
                      <div class="ChemicalGenerator-desktop_keyboard-btn ChemicalGenerator-desktop_keyboard-btn--color" data-input-bottom="segment" data-input-top="segment" data-input-center="fragment" data-input="2"><span>2</span></div>\
                      <div class="ChemicalGenerator-desktop_keyboard-btn ChemicalGenerator-desktop_keyboard-btn--color" data-input-bottom="segment" data-input-top="segment" data-input-center="fragment" data-input="3"><span>3</span></div>\
                      <div class="ChemicalGenerator-desktop_keyboard-btn ChemicalGenerator-desktop_keyboard-btn--color" data-input-bottom="segment" data-input-top="segment" data-input-center="fragment" data-input="×"><span>✖</span></div>\
                      <div class="ChemicalGenerator-desktop_keyboard-btn ChemicalGenerator-desktop_keyboard-btn--color" data-input-bottom="segment" data-input-top="segment" data-input-center="fragment" data-input="-"> <span>-</span></div>\
                      <div class="ChemicalGenerator-desktop_keyboard-btn ChemicalGenerator-desktop_keyboard-btn--color" data-input-bottom="segment" data-input-top="segment" data-input-center="fragment" data-input="0"><span>0</span></div>\
                      <div class="ChemicalGenerator-desktop_keyboard-btn ChemicalGenerator-desktop_keyboard-btn--color" data-input-bottom="segment" data-input-top="segment" data-input-center="fragment" data-input="+"><span>+</span></div>\
                      <div class="ChemicalGenerator-desktop_keyboard-btn ChemicalGenerator-desktop_keyboard-btn--color" data-input-bottom="segment" data-input-top="segment" data-input-center="fragment" data-input="/" > <span>/</span></div >\
                      <div class="ChemicalGenerator-desktop_keyboard-btn ChemicalGenerator-desktop_keyboard-btn--color" data-input-bottom="segment" data-input-top="segment" data-input-center="fragment" data-input="<" > <span><</span></div>\
                      <div class="ChemicalGenerator-desktop_keyboard-btn ChemicalGenerator-desktop_keyboard-btn--color" data-input-bottom="segment" data-input-top="segment" data-input-center="fragment" data-input=">"><span>></span></div>\
                      <div class="ChemicalGenerator-desktop_keyboard-btn ChemicalGenerator-desktop_keyboard-btn--color" data-input-bottom="segment" data-input-top="segment" data-input-center="fragment" data-input="("><span>(</span></div>\
                      <div class="ChemicalGenerator-desktop_keyboard-btn ChemicalGenerator-desktop_keyboard-btn--color" data-input-bottom="segment" data-input-top="segment" data-input-center="fragment" data-input=")"><span>)</span></div>\
                      <div class="ChemicalGenerator-desktop_keyboard-btn" data-input-pros="inputType" data-input-type="center"></div>\
                      <div class="ChemicalGenerator-desktop_keyboard-btn" data-input-pros="inputType" data-input-type="top"></div>\
                      <div class="ChemicalGenerator-desktop_keyboard-btn" data-input-pros="inputType" data-input-type="bottom"></div>\
                      <div class="ChemicalGenerator-desktop_keyboard-btn calc-table-btn" data-input-pros="backspace"><span></span></div>\
                      <div class="ChemicalGenerator-desktop_keyboard-btn ChemicalGenerator-desktop_keyboard-btn--color" data-input-bottom="segment" data-input-top="segment" data-input-center="fragment" data-input="="><span>=</span></div>\
                    <div class="ChemicalGenerator-desktop_keyboard-btn" data-input-bottom="segment" data-input-top="segment" data-input-center="fragment" data-input-pros="space" data-input="&nbsp;&nbsp;&nbsp;"><span>' + cet.translations.space + '</span></div>\
                    </div>\
                   <div class="ChemicalGenerator-desktop_keyboard-section-nonatoms">\
                    <div class="ChemicalGenerator-desktop_keyboard-btn" data-input-fragment="=="><span></span></div>\
                    <div id="keyboard_dashed_btn" class="ChemicalGenerator-desktop_keyboard-btn " data-input-bottom="segment" data-input-top="segment" data-input-center="fragment" disabled><span>⚋</span></div>\
                    <div id="keyboard_up_arrow_btn" class="ChemicalGenerator-desktop_keyboard-btn " data-input-bottom="segment" data-input-top="segment" data-input-center="fragment" disabled><span>↑</span></div>\
                    <div class="ChemicalGenerator-desktop_keyboard-btn" data-input-bottom="segment" data-input="(g)"><span>(g)</span></div>\
                    <div class="ChemicalGenerator-desktop_keyboard-btn" data-input-bottom="segment" data-input="(s)"><span>(s)</span></div>\
                    <div class="ChemicalGenerator-desktop_keyboard-btn" data-input-bottom="segment" data-input="(ℓ)"><span>(ℓ)</span></div>\
                    <div class="ChemicalGenerator-desktop_keyboard-btn" data-input-bottom="segment" data-input="(aq)"><span>(aq)</span></div>\
                    <div class="ChemicalGenerator-desktop_keyboard-btn" data-input-fragment="ΔH" ><span>ΔH=</span></div>\
                    <div id="keyboard_e-_btn" class="ChemicalGenerator-desktop_keyboard-btn " data-input-bottom="segment" data-input-top="segment" data-input-center="fragment" data-input="e⁻" ><span>e⁻</span></div>\
                    <div id="keyboard_data_delete_btn" class="ChemicalGenerator-desktop_keyboard-btn" data-input-bottom="segment" data-input-top="segment" data-input-center="fragment" data-input-fragment="data-deleted" disabled > <span></span></div >\
                    <div class="ChemicalGenerator-desktop_keyboard-btn" data-input-pros="backspace"><span></span></div>\
                  </div>\
                </div>\
              </div>';
        //<div class="ChemicalGenerator-desktop_keyboard-btn" data-input-pros="enter"><span></span></div>\
        dom = $(dom);
        chemicalGeneratorContainer.find('.ChemicalGenerator-desktop_layer[data-tab-view="EnergyGraph"]').after(dom);

        var _selectedTab = selectedTab;
        selectedTab = "chemicalProcess";
        for (var i = 0; i < state.keyboard.atoms.length; i++) {
         //   dom.eq(1).find('.ChemicalGenerator-desktop_keyboard-section').first().append('<div class="ChemicalGenerator-desktop_keyboard-btn" data-input-bottom="segment" data-input-top="segment" data-input-center="fragment" data-input="' + state.keyboard.atoms[i] + '"><span>' + state.keyboard.atoms[i] + '</span></div>');
             dom.eq(1).find('.ChemicalGenerator-desktop_keyboard-section').first().append('<div class="ChemicalGenerator-desktop_keyboard-btn" data-input-fragment="' + state.keyboard.atoms[i] + '"><span>' + state.keyboard.atoms[i] + '</span></div>');
        }
        if ('top' in state.keyboard) {
            dom.eq(1).find('.ChemicalGenerator-desktop_keyboard').css('top', state.keyboard.top);
        }
        if ('left' in state.keyboard) {
            dom.eq(1).find('.ChemicalGenerator-desktop_keyboard').css('left', state.keyboard.left);
        }

        if ('chemicalProcess' in state && 'process' in state.chemicalProcess) {
            for (var i = 0; i < state.chemicalProcess.process.length; i++) {

                dom.eq(0).append(displayProcess('chemicalProcess', i));
                $('.dH_data').change();

            }
        }

        selectedTab = _selectedTab;

        var selectedSegment = null;//chemicalGeneratorContainer.find('.ChemicalGenerator-desktop_chemicalProces-selected_segment');

        var updateDegreesOfOxidationPosition = function (process) {
            var degreesOfOxidations = process.find('.ChemicalGenerator-desktop_degreesOfOxidations .ChemicalGenerator-desktop_degreesOfOxidation');
            for (var i = 0; i < degreesOfOxidations.length; i++) {
                setDegreesOfOxidationPosition(degreesOfOxidations.eq(i), false);
            }
        };

        var addSegment = function (content) {
            if (selectedTab == "chemicalProcess" || selectedTab == "HessLaw" || selectedTab == "EnergyGraph" || selectedTab == "calcTable") {
                var process = selectedSegment.closest('.ChemicalGenerator-desktop_chemicalProces');
                if (selectedSegment == null || process.is('.ChemicalGenerator-desktop_chemicalProces--inputProcesType')) {
                    return;
                }
                var old = selectedSegment;
                var newSegment = creatSegment(content);
                old.after(newSegment);
                setSelectedSegment(newSegment);

                updateDegreesOfOxidationPosition(process);
            }
        };

        var addFragment = function (connectType, goTo) {
            if ((selectedTab == "chemicalProcess" || selectedTab == "HessLaw" || selectedTab == "EnergyGraph" || selectedTab == "calcTable")
                && $('.ChemicalGenerator-desktop_chemicalProces--selected').find('#dH_box').length == 0)
            {
                var process = selectedSegment.closest('.ChemicalGenerator-desktop_chemicalProces');
                if (selectedSegment == null || process.is('.ChemicalGenerator-desktop_chemicalProces--inputProcesType')) {
                    return;
                }
                var old = selectedSegment;
                var newFragment = creatFragment(connectType);
                old.closest('.ChemicalGenerator-desktop_chemicalProces-fragment').after(newFragment);
                setSelectedSegment(newFragment.find('.ChemicalGenerator-desktop_chemicalProces-fragment--' + goTo + ' .ChemicalGenerator-desktop_chemicalProces-segment').first());

                updateDegreesOfOxidationPosition(process);
                return newFragment;
            }
        };

        var sddFragmentS = function (connectType, goTo) {
            if (selectedTab == "chemicalProcess" || selectedTab == "HessLaw" || selectedTab == "EnergyGraph" || selectedTab == "calcTable") {
                var new_fragment;
                switch (connectType) {
                    case '+':
                    case '-':
                    case '×':
                    case '/':
                    case '=':
                    case '<':
                    case '>':
                        new_fragment = addFragment(connectType, goTo);
                        new_fragment.addClass('ChemicalGenerator-desktop_chemicalProces-fragment--isStart');
                        break;
                    case '==':
                        new_fragment = addFragment('==>', goTo);
                        new_fragment.addClass('ChemicalGenerator-desktop_chemicalProces-fragment--isStart');
                        var seg = new_fragment.find('.ChemicalGenerator-desktop_chemicalProces-fragment--center .ChemicalGenerator-desktop_chemicalProces-segment');
                        seg.addClass('ChemicalGenerator-desktop_chemicalProces-segment--pros');
                        seg.append('<input type="text" b_arrow_data=""   maxlength="7"/>');
                        //appendSpecialKeyBoard(seg, 'e⁻');
                        break;
                    case 'fraction':
                        new_fragment = addFragment('fraction', goTo);
                        new_fragment.addClass('ChemicalGenerator-desktop_chemicalProces-fragment--isStart');
                        var seg = new_fragment.find('.ChemicalGenerator-desktop_chemicalProces-fragment--center .ChemicalGenerator-desktop_chemicalProces-segment');
                        seg.addClass('ChemicalGenerator-desktop_chemicalProces-segment--pros');
                        seg.append($('<input type="text" maxlength="2"/>')).append($('<input type="text" maxlength="2"/>'));
                        initFractionEvents(seg);
                        break;
                    case 'ΔH': {
                        var selectedProcess = $('.ChemicalGenerator-desktop_chemicalProces--selected');
                        let dH_box = selectedProcess.find('#dH_box');

                        if (selectedProcess.attr('dH_shown') != undefined) {
                            selectedProcess.removeAttr('dH_shown');

                            if (dH_box.length > 0) {
                                dH_box.removeClass().addClass('ChemicalGenerator-desktop_chemicalProces').addClass('ChemicalGenerator-desktop_dH_box');
                            }
                        }
                        else {
                            selectedProcess.attr('dH_shown', 'true');

                            if (dH_box.length > 0) {
                                dH_box.removeClass().addClass('ChemicalGenerator-desktop_chemicalProces').addClass('ChemicalGenerator-desktop_dH_box-dH');
                            }
                        }
                        break;
                    }
                    case '':
                            new_fragment = addFragment('', goTo);
                        break;
                    default:
                            new_fragment = addFragment(connectType, goTo);
                }
                return new_fragment;
            }
        };

        var setInput = function (key, onTop, onCenter, onBottom) {
            if (selectedTab == "chemicalProcess" || selectedTab == "HessLaw" || selectedTab == "EnergyGraph" || selectedTab == "calcTable") {
                if (selectedSegment == null || selectedSegment.closest('.ChemicalGenerator-desktop_chemicalProces').is('.ChemicalGenerator-desktop_chemicalProces--inputProcesType')) {
                    return;
                }
                var typeRung = 0;
                var inputPlase = '';
                var inputType = '';
                if (onBottom != null) {
                    typeRung += 1;
                    inputPlase = 'bottom';
                    inputType = onBottom;
                }
                if (onTop != null) {
                    typeRung += 1;
                    inputPlase = 'top';
                    inputType = onTop;
                }
                if (onCenter != null) {
                    typeRung += 1;
                    inputPlase = 'center';
                    inputType = onCenter;
                }
                if (typeRung == 1) {
                    if (inputType == 'fragment') {
                        sddFragmentS(key, 'center');
                    }
                    else {
                        if (!selectedSegment.parent().is('.ChemicalGenerator-desktop_chemicalProces-fragment--' + inputPlase)) {
                            setMarcerTo(inputPlase);
                        }
                        addSegment(key);
                    }
                }
                else if (typeRung > 1) {
                    if (selectedSegment.parent().is('.ChemicalGenerator-desktop_chemicalProces-fragment--center') || selectedSegment.parent().is('.ChemicalGenerator-desktop_chemicalProces-fragment--center2')) {
                        if (onCenter != null) {
                            if (onCenter == 'fragment') {
                                sddFragmentS(key, 'center');
                            }
                            else {
                                addSegment(key);
                            }
                        }
                    }
                    else if (selectedSegment.parent().is('.ChemicalGenerator-desktop_chemicalProces-fragment--top')) {
                        if (onTop != null) {
                            if (onTop == 'fragment') {
                                sddFragmentS(key, 'center');
                            }
                            else {
                                addSegment(key);
                            }
                        }
                    }
                    else if (selectedSegment.parent().is('.ChemicalGenerator-desktop_chemicalProces-fragment--bottom')) {
                        if (onBottom != null) {
                            if (onBottom == 'fragment') {
                                sddFragmentS(key, 'center');
                            }
                            else {
                                addSegment(key);
                            }
                        }
                    }
                }
            }
        };

        var setSelectedSegment = function (segment) {
            if (selectedTab == "chemicalProcess" || selectedTab == "HessLaw" || selectedTab == "EnergyGraph" || selectedTab == "calcTable") {
                var inputType = '';
                dom.find('.ChemicalGenerator-desktop_chemicalProces--selected').removeClass('ChemicalGenerator-desktop_chemicalProces--selected');

                chemicalGeneratorContainer.find('.ui-resizable-handle').remove();

                if (selectedSegment != null) {
                    var fragment = selectedSegment.closest('.ChemicalGenerator-desktop_chemicalProces-fragment');
                    if (fragment.is('.ChemicalGenerator-desktop_chemicalProces-fragment2')) {
                        if (segment == null || segment.closest('.ChemicalGenerator-desktop_chemicalProces-fragment')[0] != fragment[0]) {
                            if (fragment.find('.ChemicalGenerator-desktop_chemicalProces-fragment--top .ChemicalGenerator-desktop_chemicalProces-segment:not(.ChemicalGenerator-desktop_chemicalProces-segment--empty),.ChemicalGenerator-desktop_chemicalProces-fragment--bottom .ChemicalGenerator-desktop_chemicalProces-segment:not(.ChemicalGenerator-desktop_chemicalProces-segment--empty)').length == 0) {
                                var process = fragment.closest('.ChemicalGenerator-desktop_chemicalProces');
                                fragment.remove();
                                updateDegreesOfOxidationPosition(process);
                            }
                        }
                    }
                }

                if (segment == null) {
                    chemicalGeneratorContainer.find('.ChemicalGenerator-desktop_keyboard').hide();
                    chemicalGeneratorContainer.find('.ChemicalGenerator-desktop_keyboard').removeClass('calcTableKeyboard-bigger');
                }
                else {
                    chemicalGeneratorContainer.find('.ChemicalGenerator-desktop_keyboard').show();
                    var chemicalProces = segment.closest('.ChemicalGenerator-desktop_chemicalProces');
                    chemicalProces.addClass('ChemicalGenerator-desktop_chemicalProces--selected');
                    setChemicalProcessCopyStatus();
                    chemicalProces.find('.ChemicalGenerator-desktop_chemicalProces-selected_segment').removeClass('ChemicalGenerator-desktop_chemicalProces-selected_segment');
                    segment.addClass('ChemicalGenerator-desktop_chemicalProces-selected_segment');
                    if (selectedTab == "calcTable" && segment.parents('.calcTableTbl').length > 0) {
                        chemicalGeneratorContainer.find('.ChemicalGenerator-desktop_keyboard').addClass('calcTableKeyboard');
                        selectedSegment = null;
                    }
                    else{
                        chemicalGeneratorContainer.find('.ChemicalGenerator-desktop_keyboard').removeClass('calcTableKeyboard');
                        if (selectedTab == "calcTable") {
                            selectedSegment = null;
                        }
                    }
                    if (segment.closest('.ChemicalGenerator-desktop_chemicalProces-fragment--center').length > 0 || segment.closest('.ChemicalGenerator-desktop_chemicalProces-fragment--center2').length > 0) {
                        inputType = 'center';
                    }
                    else if (segment.closest('.ChemicalGenerator-desktop_chemicalProces-fragment--top').length > 0) {
                        inputType = 'top';
                    }
                    else if (segment.closest('.ChemicalGenerator-desktop_chemicalProces-fragment--bottom').length > 0) {
                        inputType = 'bottom';
                    }
                    if (selectedSegment == null) {
                        var keyBoard = chemicalGeneratorContainer.find('.ChemicalGenerator-desktop_keyboard');
                        var kbW = keyBoard.outerWidth();
                        var kbH = keyBoard.outerHeight();
                        var intersection = eval(chemicalProces.attr('data-intersection'));
                        if (intersection) {
                            var x, y;
                            if (intersection[1] <= 12) {
                                y = ((intersection[1] + 5) * desktopGridItemSize) + 1;
                            }
                            else {
                                y = (intersection[1] * desktopGridItemSize) - 1 - (kbH / fontSize);
                            }
                            if (y < 0) {
                                y = 0;
                            }

                            if (intersection[0] <= 18) {
                                x = intersection[0] * desktopGridItemSize;
                            }
                            else {
                                x = 19 * desktopGridItemSize;
                            }

                            if (selectedTab == "calcTable" && segment.parents('.calcTableTbl').length > 0) { //keyboard position for table
                                keyBoard.addClass('calcTableKeyboard');
                                var column = segment.parents('.col');
                                var delta = 0.2;
                                var relative_top = chemicalGeneratorContainer.offset().top + $('.ChemicalGenerator-tools').outerHeight();
                                x = (column.offset().left - chemicalGeneratorContainer.offset().left) / fontSize;
                                y = (column.offset().top - relative_top + (1+delta) * column.outerHeight(true)) / fontSize;
                                var y_min = (chemicalGeneratorContainer.outerHeight() - relative_top - 1*kbH)/fontSize;
                                if (y > y_min) {
                                    y = (column.offset().top - relative_top - kbH - (0.5-delta)*column.outerHeight(true)) / fontSize;
                                }

                        }
                                else {
                                    keyBoard.removeClass('calcTableKeyboard');
                                }
                            }
                            keyBoard.css({
                                left: x + 'em',
                                top: y + 'em'
                            });
                    }
                }
                selectedSegment = segment;
                setProcesLayerFade();
                
                if (segment && $(segment.context).is('.ArrowWrapper')) {
                    chemicalGeneratorContainer.find('.ChemicalGenerator-desktop_layer-container').addClass('ChemicalGenerator-desktop_layer-container--fade');
                }
                chemicalGeneratorContainer.find('.ChemicalGenerator-desktop_keyboard').attr('data-input-type', inputType);
            }
        };

        var doBackspace = function () {
            if ((selectedTab == "chemicalProcess" || selectedTab == "HessLaw" || selectedTab == "EnergyGraph" || selectedTab == "calcTable")
                && $('.ChemicalGenerator-desktop_chemicalProces--selected').find('#dH_box').length == 0) {

                var process = selectedSegment.closest('.ChemicalGenerator-desktop_chemicalProces');

                if (selectedSegment == null || process.is('.ChemicalGenerator-desktop_chemicalProces--inputProcesType')) {
                    return;
                }
                if (selectedSegment.closest('.ChemicalGenerator-desktop_chemicalProces-fragment').is('.ChemicalGenerator-desktop_chemicalProces-fragment--isFirst')) {
                    return;
                }
                if (selectedSegment.parent().is('.ChemicalGenerator-desktop_chemicalProces-fragment--center') || selectedSegment.parent().is('.ChemicalGenerator-desktop_chemicalProces-fragment--center2')) {
                    var fragment = selectedSegment.closest('.ChemicalGenerator-desktop_chemicalProces-fragment');
                    var fragment_prev = fragment.prev('.ChemicalGenerator-desktop_chemicalProces-fragment');
                    setSelectedSegment(fragment_prev.find('.ChemicalGenerator-desktop_chemicalProces-segment:visible').last());
                    fragment.remove();
                    if (process.find('.ChemicalGenerator-desktop_chemicalProces-fragment').length <= 1) {
                        setChemicalProcessCopyStatus(false);
                    }
                    updateDegreesOfOxidationPosition(process);
                    // in EnergyGraph adjust underline to text
                    if (selectedTab == "EnergyGraph") {
                        adjustUnderLine();
                    }
                    return;
                }
                if (selectedSegment.is('.ChemicalGenerator-desktop_chemicalProces-segment--empty')) {
                    if (selectedSegment.parent().find('.ChemicalGenerator-desktop_chemicalProces-segment').length > 1) {
                        return;
                    }
                    var fragment = selectedSegment.closest('.ChemicalGenerator-desktop_chemicalProces-fragment');
                    if (fragment.find('.ChemicalGenerator-desktop_chemicalProces-fragment--top .ChemicalGenerator-desktop_chemicalProces-segment:not(.ChemicalGenerator-desktop_chemicalProces-segment--empty),.ChemicalGenerator-desktop_chemicalProces-fragment--bottom .ChemicalGenerator-desktop_chemicalProces-segment:not(.ChemicalGenerator-desktop_chemicalProces-segment--empty)').length == 0) {
                        var prev_fragment = fragment.prev();
                        setSelectedSegment(prev_fragment.find('.ChemicalGenerator-desktop_chemicalProces-segment:visible').last());
                        //fragment.remove();
                        return;
                    }
                    if (selectedSegment.parent().find('.ChemicalGenerator-desktop_chemicalProces-segment').length == 1) {
                        var prev_fragment = fragment.prev();
                        setSelectedSegment(prev_fragment.find('.ChemicalGenerator-desktop_chemicalProces-segment:visible').last());
                        return;
                    }
                }
                else {
                    var old = selectedSegment;
                    setSelectedSegment(old.prev('.ChemicalGenerator-desktop_chemicalProces-segment'));
                    old.remove();
                    updateDegreesOfOxidationPosition(process);
                    // in EnergyGraph adjust underline to text
                    if (selectedTab == "EnergyGraph") {
                        adjustUnderLine();
                    }
                }
            }
        };

        var setChemicalProcessCopyStatus = function (status) {
            var copyBtn = $('.ChemicalGenerator-desktop_chemicalProces--selected').find('.ChemicalGenerator-desktop_chemicalProces_toolbar-copyBtn');
            if ((typeof (status) != 'undefined' && !status) || $('.ChemicalGenerator-desktop_chemicalProces--selected').find('.ChemicalGenerator-desktop_chemicalProces-fragment').length <= 1) {
                copyBtn.addClass('ChemicalGenerator-desktop_chemicalProces_toolbar-btn--disabled');
            }
            else {
                copyBtn.removeClass('ChemicalGenerator-desktop_chemicalProces_toolbar-btn--disabled');
            }
        }

        var setMarcerTo = function (goTo) {
            if (selectedTab == "chemicalProcess" || selectedTab == "HessLaw" || selectedTab == "EnergyGraph" || selectedTab == "calcTable") {
                if (selectedSegment == null || selectedSegment.closest('.ChemicalGenerator-desktop_chemicalProces').is('.ChemicalGenerator-desktop_chemicalProces--inputProcesType')) {
                    return;
                }
                if (selectedSegment.parent().is('.ChemicalGenerator-desktop_chemicalProces-fragment--' + goTo) || (goTo == 'center' && selectedSegment.parent().is('.ChemicalGenerator-desktop_chemicalProces-fragment--center2'))) {
                    return;
                }
                var fragment = selectedSegment.closest('.ChemicalGenerator-desktop_chemicalProces-fragment');
                if (fragment.is('.ChemicalGenerator-desktop_chemicalProces-fragment2')) {
                    if (goTo == 'center') {
                        if (fragment.find('.ChemicalGenerator-desktop_chemicalProces-fragment--top .ChemicalGenerator-desktop_chemicalProces-segment:not(.ChemicalGenerator-desktop_chemicalProces-segment--empty),.ChemicalGenerator-desktop_chemicalProces-fragment--bottom .ChemicalGenerator-desktop_chemicalProces-segment:not(.ChemicalGenerator-desktop_chemicalProces-segment--empty)').length == 0) {
                            var prev_fragment = fragment.prev();
                            setSelectedSegment(prev_fragment.find('.ChemicalGenerator-desktop_chemicalProces-segment:visible').last());
                            //fragment.remove();
                            return;
                        }
                        setSelectedSegment(fragment.find('.ChemicalGenerator-desktop_chemicalProces-fragment--center2 .ChemicalGenerator-desktop_chemicalProces-segment').first());
                        return;
                    }
                    setSelectedSegment(fragment.find('.ChemicalGenerator-desktop_chemicalProces-fragment--' + goTo + ' .ChemicalGenerator-desktop_chemicalProces-segment').last());
                    return;
                }
                else {
                    if (goTo == 'center') {
                        return;
                    }
                    var next_fragment = fragment.next();
                    if (next_fragment.length > 0 && next_fragment.is('.ChemicalGenerator-desktop_chemicalProces-fragment2')) {
                        setSelectedSegment(next_fragment.find('.ChemicalGenerator-desktop_chemicalProces-fragment--' + goTo + ' .ChemicalGenerator-desktop_chemicalProces-segment').last());
                        return;
                    }
                    var new_fragment = sddFragmentS('', goTo);
                    new_fragment.addClass('ChemicalGenerator-desktop_chemicalProces-fragment2');
                    return;
                }
            }
        };

        unSelectProcess = function () {
            setSelectedSegment(null);
        };
        chemicalGeneratorContainer.on('keydown', 'input[special_input_keys]', function (e) {
            if ($(e.target).siblings('.special_keyboard').length > 0 && (e.keyCode == 8 || e.keyCode == 46)) {
                var val = $(e.target).val();
                deleteCharForSpecialKey(e, e.target);
            }
        });

        chemicalGeneratorContainer.on('click', '.ChemicalGenerator-desktop_chemicalProces .ChemicalGenerator-desktop_chemicalProces-segment', function (e) {
            if (selectedTab == "chemicalProcess" || selectedTab == "HessLaw" || selectedTab == "EnergyGraph" || selectedTab == "calcTable") {
                if (typeof (e.target) != "undefined" && $(e.target).is('.ChemicalGenerator-desktop_chemicalProces-segment-preTriger')) {
                    var sigments = $(this).closest('.ChemicalGenerator-desktop_chemicalProces').find('.ChemicalGenerator-desktop_chemicalProces-segment:visible');
                    var index = sigments.index($(this));
                    index--;
                    if (index < 0 || index >= sigments.length) {
                        return;
                    }
                    setSelectedSegment(sigments.eq(index));
                }
                else {
                    setSelectedSegment($(this));
                }
                e.stopPropagation();
            }
        });

        chemicalGeneratorContainer.on('click',
            '.ChemicalGenerator-desktop_chemicalProces .ChemicalGenerator-desktop_chemicalProces-fragment--center,' +
            '.ChemicalGenerator-desktop_chemicalProces .ChemicalGenerator-desktop_chemicalProces-fragment--top,' +
            '.ChemicalGenerator-desktop_chemicalProces .ChemicalGenerator-desktop_chemicalProces-fragment--bottom',
            function (e) {
                if (selectedTab == "chemicalProcess" || selectedTab == "HessLaw" || selectedTab == "EnergyGraph" || selectedTab == "calcTable") {
                    setSelectedSegment($(this).find('.ChemicalGenerator-desktop_chemicalProces-segment').last());
                    e.stopPropagation();
                }
            });

        chemicalGeneratorContainer.on('click', '.ChemicalGenerator-desktop_chemicalProces .ChemicalGenerator-desktop_chemicalProces-fragment', function (e) {
            if (selectedTab == "chemicalProcess" || selectedTab == "HessLaw" || selectedTab == "EnergyGraph" || selectedTab == "calcTable") {
                setSelectedSegment($(this).find('.ChemicalGenerator-desktop_chemicalProces-segment:visible').last());
                e.stopPropagation();
            }
        });

        chemicalGeneratorContainer.on('click', '.ChemicalGenerator-desktop_chemicalProces', function (e) {
            blurInput();
            if ((selectedTab == "chemicalProcess" || selectedTab == "HessLaw" || selectedTab == "EnergyGraph" || selectedTab == "calcTable") && !$(this).is('#dH_box')) {
                var hasSelected = $(this).find('.ChemicalGenerator-desktop_chemicalProces-selected_segment').first();
                var selected;
                if (hasSelected.length > 0) {
                    selected = hasSelected;
                }
                else {
                    selected = $(this).find('.ChemicalGenerator-desktop_chemicalProces-segment:visible').last();
                }
                setSelectedSegment(selected);
            }
        });

        chemicalGeneratorContainer.on('click', '.ChemicalGenerator-desktop_keyboard-btn', function () {
            // Any desktop button click (except delete button) cancel the delete status
            if (selectedTab == "HessLaw" && deleteStatus == true && !$(this).is(keyboard_data_delete_btn)) {
                deleteStatus = false;
                $('.ChemicalGenerator-desktop_chemicalProces-segment').removeClass('ChemicalGenerator-desktop_Delete');
            }
        });

        chemicalGeneratorContainer.on('click', '.ChemicalGenerator-desktop_keyboard-btn[data-input]', function () {
            if (selectedTab == "chemicalProcess" || selectedTab == "HessLaw" || selectedTab == "EnergyGraph" || selectedTab == "calcTable") {
                var onTop = ($(this).is('[data-input-top]')) ? $(this).attr('data-input-top') : null;
                var onCenter = ($(this).is('[data-input-center]')) ? $(this).attr('data-input-center') : null;
                var onBottom = ($(this).is('[data-input-bottom]')) ? $(this).attr('data-input-bottom') : null;
                var key = $(this).attr('data-input');

                setInput(key, onTop, onCenter, onBottom);

                // in EnergyGraph adjust underline to text
                if (selectedTab == "EnergyGraph") {
                    adjustUnderLine();
                }
            }
        });

        chemicalGeneratorContainer.on('click', '.ChemicalGenerator-desktop_keyboard-btn[data-input-fragment]', function () {

            if (selectedTab == "chemicalProcess"
                || (selectedTab == "HessLaw" && $(this).attr('data-input-fragment') != "data-deleted")
                || selectedTab == "EnergyGraph" || selectedTab == "calcTable") {

                if (selectedSegment == null || selectedSegment.closest('.ChemicalGenerator-desktop_chemicalProces').is('.ChemicalGenerator-desktop_chemicalProces--inputProcesType')) {
                    return;
                }
                sddFragmentS($(this).attr('data-input-fragment'), 'center');
                // in EnergyGraph adjust underline to text
                if (selectedTab == "EnergyGraph" && this.innerText != "ΔH=") {
                    adjustUnderLine();
                }
            }
        });

        chemicalGeneratorContainer.on('click', '.ChemicalGenerator-desktop_keyboard-btn[data-input-pros="inputType"] .ChemicalGenerator-desktop_keyboard-btn[data-input-type]', function () {
            if (selectedTab == "chemicalProcess" || selectedTab == "HessLaw" || selectedTab == "EnergyGraph" || selectedTab == "calcTable") {
                if (selectedSegment == null || selectedSegment.closest('.ChemicalGenerator-desktop_chemicalProces').is('.ChemicalGenerator-desktop_chemicalProces--inputProcesType')) {
                    return;
                }
                var inputType = $(this).attr('data-input-type');
                setMarcerTo(inputType);
            }
        });

        chemicalGeneratorContainer.on('click', '.ChemicalGenerator-desktop_keyboard-btn[data-input-pros="inputType"]', function () {
            if (selectedTab == "chemicalProcess" || selectedTab == "HessLaw" || selectedTab == "EnergyGraph" || selectedTab == "calcTable") {
                setMarcerTo($(this).attr('data-input-type'));
            }
        });

        chemicalGeneratorContainer.on('click', '.ChemicalGenerator-desktop_keyboard-btn[data-input-pros="backspace"]', function () {
            if (selectedTab == "chemicalProcess" || selectedTab == "HessLaw" || selectedTab == "EnergyGraph" || selectedTab == "calcTable") {
                doBackspace();
            }
        });

        chemicalGeneratorContainer.on('click', '.ChemicalGenerator-desktop_keyboard-btn[data-input-pros="enter"], .ChemicalGenerator-desktop_keyboard-closeBtn', function () {
            if (selectedTab == "chemicalProcess" || selectedTab == "HessLaw" || selectedTab == "EnergyGraph" || selectedTab == "calcTable") {
                setSelectedSegment(null);
            }
        });
        chemicalGeneratorContainer.on('click', '.ChemicalGenerator-desktop_keyboard-toggle-sizeBtn', function () {
            var keyboard = chemicalGeneratorContainer.find('.ChemicalGenerator-desktop_keyboard');
            if (keyboard.hasClass('calcTableKeyboard-bigger')) {
                keyboard.removeClass('calcTableKeyboard-bigger');              
            }
            else {
                keyboard.addClass('calcTableKeyboard-bigger');
            }
            setSelectedSegment(chemicalGeneratorContainer.find('.calcTableElement').find('.ChemicalGenerator-desktop_chemicalProces-selected_segment'));
        });

        chemicalGeneratorContainer.on('click', '.ChemicalGenerator-desktop_chemicalProces-fragment:not(.ChemicalGenerator-desktop_chemicalProces-fragment--isFirst):not(.ChemicalGenerator-desktop_chemicalProces-fragment--isStart):not(.ChemicalGenerator-desktop_chemicalProces-fragment2) .ChemicalGenerator-desktop_chemicalProces-fragment--center .ChemicalGenerator-desktop_chemicalProces-segment[data-oxidation]:not([data-oxidationIndex]):not([data-oxidationextraindex])', function (e) {
            if (selectedTab == "degreeOfOxidation") {
                var degreesOfOxidations = $(this).closest('.ChemicalGenerator-desktop_chemicalProces').find('.ChemicalGenerator-desktop_degreesOfOxidations');

                var oxOffset = degreesOfOxidations.offset();


                var sigments = $(this).closest('.ChemicalGenerator-desktop_chemicalProces').find('.ChemicalGenerator-desktop_chemicalProces-segment[data-oxidation]:not([data-oxidationIndex]):not([data-oxidationextraindex])');
                var index = sigments.index($(this));

                var s1 = $(this);

                var leftP1 = (s1.offset().left - oxOffset.left + (s1.width() / 2)) / fontSize;

                oxidationIndex++;
                var degreesOfOxidation = creatDegreesOfOxidation(true);
                chemicalGeneratorContainer.find('.ChemicalGenerator-desktop_degreesOfOxidation--can_resize').removeClass('ChemicalGenerator-desktop_degreesOfOxidation--can_resize');
                degreesOfOxidation.addClass('ChemicalGenerator-desktop_degreesOfOxidation--can_resize');
                protectUp = true;

                degreesOfOxidation.attr('data-oxidationIndex', oxidationIndex);
                s1.attr('data-oxidationIndex', oxidationIndex);
                degreesOfOxidation.css('left', leftP1 + 'em');

                if (e.clientY > (s1.offset().top + s1.height() / 2)) {
                    degreesOfOxidation.addClass('ChemicalGenerator-desktop_degreesOfOxidation--bottom');
                }
                degreesOfOxidations.append(degreesOfOxidation);
            }
            else if (selectedTab == "degreesOfOxidation") {
                var degreesOfOxidations = $(this).closest('.ChemicalGenerator-desktop_chemicalProces').find('.ChemicalGenerator-desktop_degreesOfOxidations');

                var oxOffset = degreesOfOxidations.offset();

                var s1, s2;
                var sigments = $(this).closest('.ChemicalGenerator-desktop_chemicalProces').find('.ChemicalGenerator-desktop_chemicalProces-segment[data-oxidation]:not([data-oxidationIndex]):not([data-oxidationextraindex])');
                var index = sigments.index($(this));

                if (index == (sigments.length - 1)) {
                    if (index == 0) {
                        return;
                    }
                    s2 = $(this);
                    s1 = sigments.eq(index - 1);
                }
                else {
                    s1 = $(this);
                    s2 = sigments.eq(index + 1);
                }

                var leftP1 = (s1.offset().left - oxOffset.left + (s1.width() / 2)) / fontSize;
                var leftP2 = (s2.offset().left - oxOffset.left + (s2.width() / 2)) / fontSize;

                oxidationIndex++;
                var degreesOfOxidation = creatDegreesOfOxidation();
                chemicalGeneratorContainer.find('.ChemicalGenerator-desktop_degreesOfOxidation--can_resize').removeClass('ChemicalGenerator-desktop_degreesOfOxidation--can_resize');
                degreesOfOxidation.addClass('ChemicalGenerator-desktop_degreesOfOxidation--can_resize');
                protectUp = true;

                degreesOfOxidation.css('left', leftP1 + 'em');
                degreesOfOxidation.find('.ChemicalGenerator-desktop_degreesOfOxidation-resize').css('width', (leftP2 - leftP1) + 'em');
                degreesOfOxidation.attr('data-oxidationIndex', oxidationIndex);
                s1.attr('data-oxidationIndex', oxidationIndex);
                s2.attr('data-oxidationIndex', oxidationIndex);
                degreesOfOxidations.append(degreesOfOxidation);
                degreesOfOxidation.find('.ChemicalGenerator-desktop_degreesOfOxidation-input input').setInputTextSize(true);
            }
            else {
                return;
            }
        });

        chemicalGeneratorContainer.on('click', '.ChemicalGenerator-desktop', function (e) {
            if (selectedTab == "chemicalProcess" || selectedTab == "HessLaw" || selectedTab == "EnergyGraph" ) {
                if (typeof (e.target) != "undefined" && $(e.target).is('.ChemicalGenerator-desktop')) {
                    var contentOffset = $(e.target).offset();
                    var x = e.clientX - contentOffset.left;
                    var y = e.clientY - contentOffset.top;
                    x = parseInt(x / fontSize / desktopGridItemSize);
                    y = parseInt(y / fontSize / desktopGridItemSize);
                    if (y > (desktopGridH - 5)) {
                        y = desktopGridH - 5;
                    }
                    x = x * desktopGridItemSize;
                    y = y * desktopGridItemSize;
                    var f = createChemicalProces(selectedTab);
                    f.css({
                        left: x + 'em',
                        top: y + 'em'
                    });

                    var desktop_layer = chemicalGeneratorContainer.find('.ChemicalGenerator-desktop_layer-container');
                    desktop_layer.find('.ChemicalGenerator-desktop_chemicalProces').map(function () {
                        if ($(this).find('.ChemicalGenerator-desktop_chemicalProces-segment:not(.ChemicalGenerator-desktop_chemicalProces-segment--empty)').length == 0
                            && !$(this).hasClass('calcTableElement')
                            && $(this).find('.ChemicalGenerator-desktop_SummaryLine').length == 0
                            && $(this).find('.ChemicalGenerator-desktop_Arrow').length == 0 && !$(this).is('#dH_box')
                        ) {
                            $(this).remove();
                        }
                    });
                    desktop_layer.append(f);
                    f[0].set_intersection();
                    setSelectedSegment(f.find('.ChemicalGenerator-desktop_chemicalProces-segment:visible').last());
                    setProcessDraggable(f);
                    setProcesLayerFade();
                }
            }
        });

        chemicalGeneratorContainer.on('focus', '.ChemicalGenerator-desktop_chemicalProces-segment.ChemicalGenerator-desktop_chemicalProces-segment--pros input', function () {
            if (selectedTab != "chemicalProcess" && selectedTab != "HessLaw" && selectedTab != "EnergyGraph" && selectedTab != "calcTable") {
                $(this).blur();
            };
        });
        chemicalGeneratorContainer.on('click', '.ChemicalGenerator-desktop_chemicalProces_toolbar-copyBtn:not(.ChemicalGenerator-desktop_chemicalProces_toolbar-btn--disabled)', function (e) {
            chemicalProcesCopy = $(this).parents('.ChemicalGenerator-desktop_chemicalProces:first').clone();
            chemicalProcesCopy.find('.calcTableTbl').remove();
            if (selectedTab == "calcTable") {
                e.stopPropagation();
            }
            $('.ChemicalGenerator-desktop_chemicalProces_toolbar-pasteBtn').removeClass('ChemicalGenerator-desktop_chemicalProces_toolbar-btn--disabled');
        })
        chemicalGeneratorContainer.on('DOMSubtreeModified', '.row_empty .col', function (e) {
            var row = $(e.target).parents('.row_empty');
            if (row.find('.ChemicalGenerator-desktop_chemicalProces-fragment:not(.ChemicalGenerator-desktop_chemicalProces-fragment--isFirst)').length > 0) {
                row.removeClass('row_empty');
            }
            if (chemicalGeneratorContainer.find('.row_empty').length==0) {
                // ADD new row
                var table = row.parents('.calcTableTbl');
                createNewTableRow(table);
            }
        });
        chemicalGeneratorContainer.on('click', '.col_delete', function (e) {
            var row = $(e.target).parents('.row');
            var table = row.parents('.calcTableTbl');
            chemicalGeneratorContainer.find('.calcTableTbl .row_i-' + $(this).attr('delete_r_index')).remove();
            if (chemicalGeneratorContainer.find('.row_empty').length == 0) {
                // ADD new row
                createNewTableRow(table);
            }
            setTableWidthScrollbar(table);
            e.stopPropagation();
        });
        chemicalGeneratorContainer.on('click',  '.col_drag, .col_combo', function (e) {
            e.stopPropagation();
        })
       
        chemicalGeneratorContainer.on('click', '.ChemicalGenerator-desktop_chemicalProces_toolbar-setTableBtn', function (e) {
            var selectedProcess = $('.calcTableElement');
            var newFragments = selectedProcess.children('.ChemicalGenerator-desktop_chemicalProces-fragment').clone();
            var newGroups = [[]];
            addBorder = [];
            var added = false;
            var hasElem = false;
            for (var i = 0; i < newFragments.length; i++) {
                if ($(newFragments[i]).hasClass('ChemicalGenerator-desktop_chemicalProces-fragment--isFirst') || $(newFragments[i]).hasClass('ChemicalGenerator-desktop_chemicalProces-fragment--isStart')) {
                    if (added) {
                        newGroups.push([]);
                    }
                    if (newGroups.length > 1 && $(newFragments[i]).find('.ChemicalGenerator-desktop_chemicalProces-segment[data-content="==>"]').length > 0) {
                        addBorder.push(newGroups.length - 2);
                    }
                    added = false;
                }
                else {
                    if (added || $(newFragments[i]).find('.ChemicalGenerator-desktop_chemicalProces-fragment--center .ChemicalGenerator-desktop_chemicalProces-segment').attr('data-oxidation') != undefined || $(newFragments[i]).find('.ChemicalGenerator-desktop_chemicalProces-fragment--center .ChemicalGenerator-desktop_chemicalProces-segment').attr('data-content')=='(') {
                        newGroups[newGroups.length - 1].push(newFragments[i]);
                        added = true;
                        hasElem = true;
                    }
                }
            }
            if (!hasElem) {//no elem
                selectedProcess.find('.calcTableTbl').remove();
            }
            else if (newGroups.length > 6) { //alert more than max elem

                confirmMassege(cet.translations.startoverTitle,
                    cet.translations.molecule_max_count_messege,
                    "",
                    cet.translations.confirmation,
                    function () {

                    },
                    function () {
                    },
                    {});
            }
            else {

                var oldData = selectedProcess.find('.calcTableTbl').clone();
                oldData =addComboSelectedDataToRow(oldData, selectedProcess);
                var headers = oldData.find('.row_header .col:not(.col_delete):not(.col_drag):not(.col_combo)'); ///ChemicalGenerator-desktop_chemicalProces-fragment

                var newData = [];
                selectedProcess.find('.calcTableTbl').remove();
                var table = $('<div class="calcTableTbl"><div class="row_header"></div><div class="rows_container"></div></div>');
                selectedProcess.append(table);
                var columns = 0;
                var row = table.find('.row_header');
                for (var i = 0; i < newGroups.length; i++) {
                    var g = newGroups[i];
                    if (g.length > 0) {
                        var newdiv = $('<div class="col col_i-' + i + '"></div>');
                        row.append(newdiv);
                        if (addBorder.length > 0 && addBorder.indexOf(i) > -1) {
                            newdiv.addClass('col_border');
                        }
                        newdiv = row.find(".col_i-" + i).eq(0);
                        for (var j = 0; j < g.length; j++) {
                            newdiv.append(g[j]);
                        }
                        var newColumn = newdiv[0].textContent.replace(/\s{2,}/g, '').trim();
                        if (headers.length > 0) {
                            var exists = false;
                            for (var k = 0; k < headers.length; k++) {
                                if (oldData.find('.row_header .col_i-' + k)[0].textContent.replace(/\s{2,}/g, '').trim() == newColumn) {
                                    if (newData.indexOf(k) > -1) {
                                        continue;
                                    }
                                    else {
                                        newData[columns] = k;
                                        exists = true;
                                        break;
                                    }
                                }
                            }
                            if (!exists) {
                                newData[columns] = "";
                            }

                        }
                        columns++;
                    }
                }
                if (columns > 0) {
                    row.prepend('<div class="col col_delete"></div>');

                    var col_combo1 = $('<div class="col col_combo"><span>' + cet.translations.units + '</span></div>');
                    row.append(col_combo1);
                    var col_combo2 = $('<div class="col col_combo"><span>' + cet.translations.size + '</span></div>');
                    row.append(col_combo2);
                    row.append('<div class="col col_drag"></div>');
                    var rows = oldData.find('.row');
                    var row_count;

                    if (rows.length > 0) {
                        row_count = oldData.find('.row').length;
                    }

                    for (var j = 0; j < row_count; j++) {
                        var row_data = oldData.find('.row').eq(j);
                        createNewTableRow(table, row_data, newData);
                        setInputsData(table, row_data, j);
                    }
                    if (table.find('.row_empty').length == 0) {
                        createNewTableRow(table);
                    }
                }
                var rows_container = table.find('.rows_container');
                rows_container.sortable({ handle: ".col_drag" });
                setTableWidthScrollbar(table);
            }
            e.stopPropagation();
        });
        
        chemicalGeneratorContainer.on('click', '.ChemicalGenerator-desktop_chemicalProces_toolbar-pasteBtn', function () {
            if (typeof (chemicalProcesCopy) != 'undefined' && chemicalProcesCopy.find('.ChemicalGenerator-desktop_chemicalProces-fragment').length > 1) {
                var newFragments = chemicalProcesCopy.find('.ChemicalGenerator-desktop_chemicalProces-fragment').clone();
                newFragments.find('.ChemicalGenerator-desktop_chemicalProces-segment').removeAttr('data-oxidationindex').removeAttr('data-oxidationextraindex');

                var currentfragment = $('.ChemicalGenerator-desktop_chemicalProces--selected').find('.ChemicalGenerator-desktop_chemicalProces-selected_segment').parents('.ChemicalGenerator-desktop_chemicalProces-fragment:first');
                if (selectedTab == "calcTable" && (currentfragment.length == 0 || currentfragment.parents('.calcTableTbl').length > 0) ) {
                        currentfragment = chemicalGeneratorContainer.find(".calcTableElement>.ChemicalGenerator-desktop_chemicalProces-fragment:last");
                        $('.ChemicalGenerator-desktop_chemicalProces--selected').find('.ChemicalGenerator-desktop_chemicalProces-selected_segment').removeClass('ChemicalGenerator-desktop_chemicalProces-selected_segment');
                        setSelectedSegment(currentfragment.find('.ChemicalGenerator-desktop_chemicalProces-segment:visible').last());
                }
                for (var i = 1; i < newFragments.length; i++) {
                    currentfragment.after(newFragments[i]);
                    var fractionSegment = $(newFragments[i]).find('.ChemicalGenerator-desktop_chemicalProces-segment[data-content="fraction"]');
                    if (typeof (fractionSegment) != 'undefined' && fractionSegment.length > 0) {
                        initFractionEvents(fractionSegment);
                    }

                    var specialkey = $(newFragments[i]).find('.ChemicalGenerator-desktop_chemicalProces-segment .special_keyboard');
                    if (typeof (specialkey) != 'undefined' && specialkey.length > 0) {
                        specialkey.on('click', function (e) {
                            insertAtCursor($(this).siblings("input")[0], $(this).text());
                            e.stopPropagation();
                        });
                    }
                    currentfragment = newFragments[i];
                }
                updateDegreesOfOxidationPosition($('.ChemicalGenerator-desktop_chemicalProces--selected'));      

                var process_sel = chemicalGeneratorContainer.find('.ChemicalGenerator-desktop_chemicalProces--selected')[0];               
                // in EnergyGraph adjust underline to text
                if (selectedTab == "EnergyGraph") {
                    adjustUnderLine();
                    var selectedLine = $(process_sel).next('.LineWrapper');
                }
                if (typeof (process_sel) != undefined && selectedTab != "calcTable") {
                    process_sel.try_set_intersection();
                    var intersection_data = eval($(process_sel).attr('data-intersection'));
                     if (intersection_data[0]<1) {
                         $(process_sel).attr('data-intersection', '[' + 1 + ',' + intersection_data[1] + ',' + intersection_data[2] + ',' + intersection_data[3] + ']');
                         intersection_data = eval($(process_sel).attr('data-intersection'));
                    }
                    $(process_sel).animate({
                        left: (intersection_data[0] * desktopGridItemSize) + 'em',
                        top: (intersection_data[1] * desktopGridItemSize) + 'em'
                    }, 100);
                    if (selectedLine) {
                        $(selectedLine).animate({
                            left: (intersection_data[0] * desktopGridItemSize) + 'em',
                            top: (intersection_data[1] * desktopGridItemSize + 9) + 'em'
                        }, 100);
                    }
                }                
            }
        })
        chemicalGeneratorContainer.on('click', '.ChemicalGenerator-desktop_chemicalProces_toolbar-deleteBtn', function (e) {
            e.stopPropagation();
            chemicalGeneratorContainer.find('.ChemicalGenerator-desktop_chemicalProces--selected').addClass('delete_process');
            setSelectedSegment(null);
            $('.delete_process').fadeOut(300, function () { $(this).remove(); });

        })
        chemicalGeneratorContainer.on('click', '.ChemicalGenerator-desktop_chemicalProces_toolbar-swapBtn', function () {
            var selectedProcess = $('.ChemicalGenerator-desktop_chemicalProces--selected');

            var degresesSegments = selectedProcess.find('.ChemicalGenerator-desktop_chemicalProces-segment[data-oxidationindex]');
            if (degresesSegments.length > 0) { //shouldn't swap when has degrees of oxydation
                return;
            }
            var selectedProcessSwappedStatus = ToggleProcessSwappedStatus(selectedProcess);
            if (selectedProcess.find('.ChemicalGenerator-desktop_chemicalProces-segment[data-content="==>"]').length > 0) {
                var fragments = selectedProcess.find(".ChemicalGenerator-desktop_chemicalProces-fragment");
                var newGroups = [[]];
                //var degresesSegments = selectedProcess.find('.ChemicalGenerator-desktop_chemicalProces-segment[data-oxidationindex]');
                //var processIndexes = [];
                //var duplicateIndexes = [];
                //if (degresesSegments.length > 0) {
                //    for (var i = 0; i < degresesSegments.length; i++) {
                //        var currrent_degree = $(degresesSegments[i]);
                //        if (processIndexes.indexOf(currrent_degree.attr('data-oxidationindex')) >= 0 && duplicateIndexes.indexOf(currrent_degree.attr('data-oxidationindex')) < 0) {
                //            duplicateIndexes.push(currrent_degree.attr('data-oxidationindex'));
                //        }
                //        processIndexes.push(currrent_degree.attr('data-oxidationindex'));
                //        currrent_degree.attr('oldOfsetLeft', currrent_degree.offset().left);
                //    }
                //}
                for (i = 1; i < fragments.length; i++) {
                    var arrow_fragment = $(fragments[i]).find('.ChemicalGenerator-desktop_chemicalProces-segment[data-content="==>"]');
                    if (arrow_fragment.length > 0) {
                        var arrow_input = arrow_fragment.find('input');
                        var new_data = selectedProcessSwappedStatus ? "" : arrow_input.attr('b_arrow_data');
                        arrow_input.val(new_data);
                        newGroups.push([fragments[i]]);
                        newGroups.push([]);
                    }
                    else {
                        newGroups[newGroups.length - 1].push(fragments[i]);
                    }
                }
                for (var i = newGroups.length - 1; i > -1; i--) {
                    var g = newGroups[i];
                    for (var j = 0; j < g.length; j++) {
                        selectedProcess.append(g[j]);
                    }
                }
                var dh = selectedProcess.find(".ChemicalGenerator-desktop_chemicalProces_dH");

                //if (duplicateIndexes.length > 0) {
                //    for (var i = 0; i < duplicateIndexes.length; i++) {
                //        var current_index = duplicateIndexes[i];
                //        var indexSegments = selectedProcess.find('.ChemicalGenerator-desktop_chemicalProces-segment[data-oxidationindex][data-oxidationindex="' + current_index + '"]');
                //        if (indexSegments.length == 2) {
                //            var left = parseInt(indexSegments.eq(0).attr('oldOfsetLeft'));
                //            var right = parseInt(indexSegments.eq(1).attr('oldOfsetLeft'));
                //            var degreesOfOxidation = $('.ChemicalGenerator-desktop_degreesOfOxidation[data-oxidationindex="' + current_index + '"]');
                //            if (left > right) {
                //                var degreeL = degreesOfOxidation.children('.ChemicalGenerator-desktop_degreesOfOxidation-num--left');
                //                var degreeR = degreesOfOxidation.children('.ChemicalGenerator-desktop_degreesOfOxidation-num--right');
                //                degreeL.insertBefore(degreeR);
                //                degreeL.removeClass('ChemicalGenerator-desktop_degreesOfOxidation-num--left');
                //                degreeL.addClass('ChemicalGenerator-desktop_degreesOfOxidation-num--right');
                //                degreeR.removeClass('ChemicalGenerator-desktop_degreesOfOxidation-num--right');
                //                degreeR.addClass('ChemicalGenerator-desktop_degreesOfOxidation-num--left');

                //                var extraOxidationStartsFrom = degreesOfOxidation.attr('extra_oxidation');
                //                if (extraOxidationStartsFrom != undefined) {
                //                    var extraLeft = selectedProcess.find('.ChemicalGenerator-desktop_chemicalProces-segment[data-oxidationextraindex="' + current_index + '"]').eq(0).offset().left;
                //                    console.log('extraLeft', extraLeft);
                //                    console.log('Left', degreesOfOxidation.children('.ChemicalGenerator-desktop_degreesOfOxidation-num--left').offset().left);
                //                    console.log('Right', degreesOfOxidation.children('.ChemicalGenerator-desktop_degreesOfOxidation-num--right').offset().left);
                //                    if (extraOxidationStartsFrom == 'left') {
                //                        degreesOfOxidation.attr('extra_oxidation', 'right');
                //                        degreesOfOxidation.find('.ChemicalGenerator-desktop_degreesOfOxidation_extra').attr('startsfrom', 'right');

                //                    }
                //                    else if (extraOxidationStartsFrom == 'right') {
                //                        degreesOfOxidation.attr('extra_oxidation', 'left');
                //                        degreesOfOxidation.find('.ChemicalGenerator-desktop_degreesOfOxidation_extra').attr('startsfrom', 'left');
                //                    }
                //                }

                //            }


                //        }
                //    }
                //}            
                // selectedProcess.find('.ChemicalGenerator-desktop_chemicalProces-segment[data-oxidationindex][oldOfsetLeft]').removeAttr('oldOfsetLeft');

                //var bDataDHIndex = selectedProcessSwappedStatus ? "": selectedProcess.attr('process_dh_index');
                //var bDataDHData = selectedProcessSwappedStatus ? "" : selectedProcess.attr('process_dh_data');
                //if (!selectedProcessSwappedStatus) {
                dh.find('input.dH_index').val(selectedProcess.attr('process_dh_index'));
                dh.find('input.dH_data').val(selectedProcess.attr('process_dh_data'));
                dh.find('input.dH_data').change();
                //}

                selectedProcess.append(dh);
                updateDegreesOfOxidationPosition(selectedProcess);
            }
        })
        function setInputsData(table, row_data, row_index) {
            var inputs = row_data.find('input');
            if (inputs.length > 0) {
                for (var k = 0; k < inputs.length; k++) {
                    table.find('.row_i-' + row_index + ' input').eq(k).val(inputs.eq(k).val());
                }
            }
        }
      
        function ToggleProcessSwappedStatus(selectedProcess) {
            var swappedStatus;
            if (typeof (selectedProcess.attr('swapped')) != 'undefined') {
                selectedProcess.removeAttr('swapped');
                swappedStatus = false;
            }
            else {
                selectedProcess.attr('swapped', 'true');
                swappedStatus = true;
            }
            return swappedStatus;
        }

        window.ChemicalGeneratorKeypress = function (e) {
            if (selectedTab == "chemicalProcess" || selectedTab == "HessLaw" || selectedTab == "EnergyGraph" || selectedTab == "calcTable") {
                if (selectedSegment == null || selectedSegment.closest('.ChemicalGenerator-desktop_chemicalProces').is('.ChemicalGenerator-desktop_chemicalProces--inputProcesType')) {
                    return;
                }
                var key = Number(e.keyCode);
                if (key >= 48 && key <= 57) { //0-9
                    setInput(((key - 48) + ''), 'segment', 'fragment', 'segment');
                }
                else if (key == 62) { //>
                    setInput('>', 'segment', 'fragment', 'segment');
                }
                else if (key == 61) { //*
                    setInput('=', 'segment', 'fragment', 'segment');
                }
                else if (key == 60) { //<
                    setInput('<', 'segment', 'fragment', 'segment');
                }
                else if (key == 47) { // /
                    setInput('/', 'segment', 'fragment', 'segment');
                }
                else if (key == 46) { //.
                    setInput('.', 'segment', 'fragment', 'segment');
                }
                else if (key == 43) { //+
                    setInput('+', 'segment', 'fragment', 'segment');
                }
                else if (key == 45) { //-
                    setInput('-', 'segment', 'fragment', 'segment');
                }
                else if (key == 42) { //*
                    setInput('×', 'segment', 'fragment', 'segment');
                }
                else if (key == 41) { //)
                    setInput(')', 'segment', 'fragment', 'segment');
                }
                else if (key == 40) { //(
                    setInput('(', 'segment', 'fragment', 'segment');
                }
                else if (key == 32) { //* space
                    setInput('&nbsp;&nbsp;&nbsp;', 'segment', 'fragment', 'segment');
                }
                else if (key == 13) { //enter
                    setSelectedSegment(null);
                }
            }
        };

        function deleteCharForSpecialKey(e, myField) {
            var startPos = myField.selectionStart;
            var endPos = myField.selectionEnd;

            var deletedValue = myField.value.substring(startPos - 1, startPos);

            if (typeof (deletedValue) != undefined && startPos == endPos) // valid for simple delete!!!
            {
                var valueBefore = myField.value.substring(startPos - 2, startPos - 1);
                var valueAfter = myField.value.substring(startPos, startPos + 1);

                if (deletedValue == "⁻" && typeof (valueBefore) != 'undefined' && valueBefore == "e") {
                    myField.value = (myField.value.substring(0, startPos - 2) + myField.value.substring(startPos, myField.value.length));
                    myField.setSelectionRange(startPos - 2, startPos - 2);
                    e.preventDefault();
                }
                else if (deletedValue == "e" && typeof (valueAfter) != 'undefined' && valueAfter == "⁻") {
                    myField.value = (myField.value.substring(0, startPos - 1) + myField.value.substring(startPos + 1, myField.value.length));
                    myField.setSelectionRange(startPos - 1, startPos - 1);
                    e.preventDefault();
                }

                $(myField).change();
            }
            return false;
        }
        window.ChemicalGeneratorArrowKeypress = function (e) {
            if (selectedTab == "chemicalProcess" || selectedTab == "HessLaw" || selectedTab == "EnergyGraph" || selectedTab == "calcTable") {
                if (selectedSegment == null || selectedSegment.closest('.ChemicalGenerator-desktop_chemicalProces').is('.ChemicalGenerator-desktop_chemicalProces--inputProcesType')) {
                    return;
                }
                var key = e.keyCode;
                if (key == 8) {// backspace
                    doBackspace();
                }
                else if (key == 38) {//A
                    var goTo = 'top';
                    if (selectedSegment.parent().is('.ChemicalGenerator-desktop_chemicalProces-fragment--bottom')) {
                        goTo = 'center';
                    }
                    setMarcerTo(goTo);
                }
                else if (key == 40) {//V
                    var goTo = 'bottom';
                    if (selectedSegment.parent().is('.ChemicalGenerator-desktop_chemicalProces-fragment--top')) {
                        goTo = 'center';
                    }
                    setMarcerTo(goTo);
                }
                else if (key == 37) {//<-
                    var sigments = selectedSegment.closest('.ChemicalGenerator-desktop_chemicalProces').find('.ChemicalGenerator-desktop_chemicalProces-segment:visible');
                    var index = sigments.index(selectedSegment);
                    index--;
                    if (index < 0 || index >= sigments.length) {
                        return;
                    }
                    setSelectedSegment(sigments.eq(index));
                }
                else if (key == 39) {//->
                    var sigments = selectedSegment.closest('.ChemicalGenerator-desktop_chemicalProces').find('.ChemicalGenerator-desktop_chemicalProces-segment:visible');
                    var index = sigments.index(selectedSegment);
                    index++;
                    if (index < 0 || index >= sigments.length) {
                        return;
                    }
                    setSelectedSegment(sigments.eq(index));
                }
            }
        };
    }

    function addComboSelectedDataToRow(oldData, selectedProcess) {
        for (var i = 0; i < oldData.find('.row').length; i++) {
            var com1 = selectedProcess.find('.row_i-' + i + ' .col_combo1').find('option:selected').text();
            oldData.find('.row_i-' + i).attr('col_combo1', com1);
            var com2 = selectedProcess.find('.row_i-' + i + ' .col_combo2').find('option:selected').text();
            oldData.find('.row_i-' + i).attr('col_combo2', com2);
        }
        return oldData;
    }
    function displayProcess(tab, i) {

        switch (tab) {
            case 'chemicalProcess':
                var p = state.chemicalProcess.process[i];
                break;
            case 'HessLaw':
                var p = state.HessLaw.process[i];
                break;
            case 'EnergyGraph':
                var p = state.EnergyGraph.process[i];
                break;
            case 'calcTable':
                var p = state.calcTable.process[i];
                break;
        }

        var process = createChemicalProces(tab);
        var top = 0, left = 0;
        if ('top' in p) {
            top = p.top * desktopGridItemSize;
        }
        if ('left' in p) {
            left = p.left * desktopGridItemSize;
        }
        process.css({
            top: top + 'em',
            left: left + 'em'
        });

        var lstF = process.find('.ChemicalGenerator-desktop_chemicalProces-fragment');
        if ('data' in p) {
            if (p.data.length > 0) {
                createProcessDataFromPreset(p.data, lstF);
            }
        }
        if ('dH' in p) {
            if (p.dH.visible) {
                process.attr('dh_shown', 'true');
            }
            var dh = process.find('.ChemicalGenerator-desktop_chemicalProces_dH');
            dh.find('input').eq(0).val(p.dH.dh_index);
            dh.find('input').eq(1).val(p.dH.dH_data);
            process.attr({ 'process_dh_index': p.dH.dh_initial_index, 'process_dh_data': p.dH.dh_initial_data });
        }
        if (p.swapped) {
            process.attr('swapped', 'true');
        }

        if (tab == "HessLaw" && p.Deleted) {
            var deletedMolecule = p.Deleted.split(';');

            for (j = 0; j < deletedMolecule.length; j++) {
                var deleted = deletedMolecule[j].split(',');

                for (i = 0; i < deleted.length; i++) {
                    $(process.find('.ChemicalGenerator-desktop_chemicalProces-fragment')[deleted[i]]).addClass('ChemicalGenerator-MoleculePart');
                }    
                $(process.find('.ChemicalGenerator-MoleculePart')).wrapAll("<div class='ChemicalGenerator_Molecule' />");
                $(process.find('.ChemicalGenerator-MoleculePart')).removeClass('ChemicalGenerator-MoleculePart');
            }
        }


        return process;
    }
    function createProcessDataFromPreset(data, lstF) {
        var process = lstF.closest('.ChemicalGenerator-desktop_chemicalProces');
        for (var j = 0; j < data.length; j++) {
            if ('center' in data[j] && data[j].center.length > 0) {
                for (var k = 0; k < data[j].center.length; k++) {
                    var frag = data[j].center[k];
                    var isHasConnection = !(typeof (frag) == "string");

                    var connectType = isHasConnection ? frag[0] : frag;
                    var ch = ((connectType == '==') ? '==>' : connectType);
                    var newFragment = creatFragment(ch); 
                    if ( connectType == '==' ||  specialKeyboardSigns.indexOf(connectType) !== -1) {
                        newFragment.addClass('ChemicalGenerator-desktop_chemicalProces-fragment--isStart');
                    }
                    if (connectType == '==') {
                        var seg = newFragment.find('.ChemicalGenerator-desktop_chemicalProces-fragment--center .ChemicalGenerator-desktop_chemicalProces-segment');
                        seg.addClass('ChemicalGenerator-desktop_chemicalProces-segment--pros');
                        var input = $('<input type="text"  maxlength="7"/>');
                        if (isHasConnection) {
                            input.val(frag[1]);
                            input.attr('b_arrow_data', typeof (frag[2] != 'undefined') ? frag[2] : '');
                        }
                        seg.append(input);
                        //appendSpecialKeyBoard(seg, 'e⁻');

                    }
                    else if (connectType == 'fraction') {
                        var seg = newFragment.find('.ChemicalGenerator-desktop_chemicalProces-fragment--center .ChemicalGenerator-desktop_chemicalProces-segment');
                        seg.addClass('ChemicalGenerator-desktop_chemicalProces-segment--pros');
                        var input0 = $('<input type="text" maxlength="2"/>');
                        var input1 = $('<input type="text" maxlength="2"/>');
                        if (isHasConnection) {
                            input0.val(frag[1]);
                            input1.val(frag[2]);
                        }
                        seg.append(input0).append(input1);
                        initFractionEvents(seg);
                    }
                    lstF.after(newFragment);
                    lstF = newFragment;

                    if (isHasConnection && connectType != '==') {
                        var connactionDataKey = ('c' + frag[1].replace('e', '').replace('c', ''));
                        if (('data' in state.degreesOfOxidation) && (connactionDataKey in state.degreesOfOxidation.data)) {
                            var connactionData = state.degreesOfOxidation.data[connactionDataKey];
                            if (connactionData.length < 2 || !('index' in connactionData[1])) {
                                oxidationIndex++;
                                if (connactionData.length < 2) {
                                    connactionData[1] = {};
                                }
                                connactionData[1].index = oxidationIndex;
                                var degreesOfOxidation = creatDegreesOfOxidation();
                                degreesOfOxidation.attr('data-oxidationIndex', oxidationIndex);

                                if ('isBottom' in connactionData[1] && connactionData[1].isBottom) {
                                    degreesOfOxidation.addClass('ChemicalGenerator-desktop_degreesOfOxidation--bottom');
                                }
                                if ('height' in connactionData[1]) {
                                    var height = connactionData[1].height;
                                    degreesOfOxidation.find('.ChemicalGenerator-desktop_degreesOfOxidation-resize').css('height', height);
                                }
                                if ('text' in connactionData[1]) {
                                    var text = connactionData[1].text;
                                    degreesOfOxidation.find('.ChemicalGenerator-desktop_degreesOfOxidation-input input').val(text);
                                }

                                if (connactionData[0].length > 0) {
                                    var num1 = getDegreeNum(connactionData[0][0]);
                                    var numL = degreesOfOxidation.find('.ChemicalGenerator-desktop_degreesOfOxidation-num--left');
                                    numL.find('.ChemicalGenerator-desktop_degreesOfOxidation-num-input input').val(num1);
                                    setDegreeEmptyStyle(numL);
                                }

                                if (connactionData[0].length > 1) {
                                    var num2 = getDegreeNum(connactionData[0][1]);
                                    var numR = degreesOfOxidation.find('.ChemicalGenerator-desktop_degreesOfOxidation-num--right');
                                    numR.find('.ChemicalGenerator-desktop_degreesOfOxidation-num-input input').val(num2);
                                    setDegreeEmptyStyle(numR);
                                }
                                else {
                                    degreesOfOxidation.find('.ChemicalGenerator-desktop_degreesOfOxidation-num--right').remove();
                                    degreesOfOxidation.find('.ChemicalGenerator-desktop_degreesOfOxidation-resize').remove();
                                    degreesOfOxidation.find('.ChemicalGenerator-desktop_degreesOfOxidation-input').remove();
                                    degreesOfOxidation.append('<div class="ChemicalGenerator-desktop_degreesOfOxidation-add ChemicalGenerator-desktop_degreesOfOxidation-add-single" add_from="left"><span>+</span></div>');
                                }
                                if (connactionData[2].length > 0) {
                                    degreesOfOxidation.find('.ChemicalGenerator-desktop_degreesOfOxidation-num--left .ChemicalGenerator-desktop_degreesOfOxidation-num-input-left input').val(connactionData[2][0]);
                                    degreesOfOxidation.find('.ChemicalGenerator-desktop_degreesOfOxidation-num--right .ChemicalGenerator-desktop_degreesOfOxidation-num-input-left input').val(connactionData[2][1]);
                                }
                                process.find('.ChemicalGenerator-desktop_degreesOfOxidations').append(degreesOfOxidation);
                                initOxidationDataTemp.push({
                                    oxidation: degreesOfOxidation,
                                    content: process.find('.ChemicalGenerator-desktop_degreesOfOxidations'),
                                    extraoxidation: ('extra_starts_from' in connactionData[1]) ? {
                                        "extra_starts_from": connactionData[1].extra_starts_from,
                                        "text_extra": connactionData[1].text_extra,
                                        "extra_num_input": connactionData[1].extra_num_input,
                                        "extra_num_input_left": connactionData[1].extra_num_input_left
                                    } : false
                                });
                            }

                            if (frag[1].startsWith('e')) {
                                newFragment.find('.ChemicalGenerator-desktop_chemicalProces-fragment--center .ChemicalGenerator-desktop_chemicalProces-segment[data-oxidation]').attr('data-oxidationextraindex', connactionData[1].index);
                            }
                            else {
                                newFragment.find('.ChemicalGenerator-desktop_chemicalProces-fragment--center .ChemicalGenerator-desktop_chemicalProces-segment[data-oxidation]').attr('data-oxidationIndex', connactionData[1].index);
                            }
                        }
                    }
                }
            }
            else {
                if (('top' in data[j] && data[j].top.length > 0) || ('bottom' in data[j] && data[j].bottom.length > 0)) {
                    var newFragment = creatFragment('');
                    newFragment.addClass('ChemicalGenerator-desktop_chemicalProces-fragment2');
                    if ('top' in data[j] && data[j].top.length > 0) {
                        var topF = newFragment.find('.ChemicalGenerator-desktop_chemicalProces-fragment--top');
                        for (var k = 0; k < data[j].top.length; k++) {
                            topF.append(creatSegment(data[j].top[k]));
                        }
                    }
                    if ('bottom' in data[j] && data[j].bottom.length > 0) {
                        var bottomF = newFragment.find('.ChemicalGenerator-desktop_chemicalProces-fragment--bottom');
                        for (var k = 0; k < data[j].bottom.length; k++) {
                            bottomF.append(creatSegment(data[j].bottom[k]));
                        }
                    }
                    lstF.after(newFragment);
                    lstF = newFragment;
                }
            }
        }
    }
    var input;
    var blurInput = function () { };
    var setProcesLayerFade = function () {
        var layer = chemicalGeneratorContainer.find('.ChemicalGenerator-desktop_layer-container');
        var isFade = layer.find('.ChemicalGenerator-desktop_chemicalProces').length > 1 && layer.find('.ChemicalGenerator-desktop_chemicalProces--selected, .ChemicalGenerator-desktop_chemicalProces--inputProcesType').length > 0;
        if (isFade) {
            layer.addClass('ChemicalGenerator-desktop_layer-container--fade');
        }
        else {
            layer.removeClass('ChemicalGenerator-desktop_layer-container--fade');
        }
    }
    var createChemicalProces = function (tab) {
        var process_toolbar = '<div class="ChemicalGenerator-desktop_chemicalProces_toolbar">' +
            '<div class="ChemicalGenerator-desktop_chemicalProces_toolbar-copyBtn"></div>\
                              <div class="ChemicalGenerator-desktop_chemicalProces_toolbar-pasteBtn ' + (typeof (chemicalProcesCopy) == 'undefined' ? 'ChemicalGenerator-desktop_chemicalProces_toolbar-btn--disabled' : '') + '"></div>\
                              <div class="ChemicalGenerator-desktop_chemicalProces_toolbar-swapBtn"></div>\
                              <div class="ChemicalGenerator-desktop_chemicalProces_toolbar-deleteBtn"></div>\
                          </div>';
        var newchemicalProces = $('<div class="ChemicalGenerator-desktop_chemicalProces can_trash ' + tab + 'Element" process_dh_index="" process_dh_data="">' + process_toolbar + '<div class="ChemicalGenerator-desktop_degreesOfOxidations"></div></div>');
        var newFragment = creatFragment('');
        newFragment.addClass('ChemicalGenerator-desktop_chemicalProces-fragment--isFirst');
        newchemicalProces.append(newFragment);

        init_intersection(newchemicalProces[0]);
        var dH = '<div class="ChemicalGenerator-desktop_chemicalProces_dH">' +
            '<div class="dH-container" ><div >ΔH </div></div>' +
            '<input class="dH_index" type="text" maxlength="1"></input>' +
            '<div><div>=</div></div>' +
            '<input class="dH_data" type="text" maxlength="9"></input>' +
            '</div>';
        newchemicalProces.append(dH);
        newchemicalProces.find('.dH_data').setInputTextSize(true);
        newchemicalProces.on('click', 'input', function (event) {
            unSelectProcess();
            newchemicalProces.addClass('ChemicalGenerator-desktop_chemicalProces--inputProcesType');
            input = $(this);
            blurInput = function () {
                input.blur();
                blurInput = function () { };
            };
            $(document).on('click', blurInput);
            chemicalGeneratorContainer.on('click', '.ChemicalGenerator-desktop_chemicalProces .ChemicalGenerator-desktop_chemicalProces-fragment .ChemicalGenerator-desktop_chemicalProces-segment', blurInput);
            setProcesLayerFade();
            event.stopPropagation();
        });
        newchemicalProces.on('focusout', 'input', function () {
            $(document).off('click', blurInput);
            chemicalGeneratorContainer.off('click', '.ChemicalGenerator-desktop_chemicalProces .ChemicalGenerator-desktop_chemicalProces-fragment .ChemicalGenerator-desktop_chemicalProces-segment', blurInput);
            newchemicalProces.removeClass('ChemicalGenerator-desktop_chemicalProces--inputProcesType');
            setProcesLayerFade();
            blurInput = function () { };
        });
        return newchemicalProces;
    };

    var init_intersection = function (elment) {
        elment.set_intersection = function () {
            var intersection_data = this.create_intersection();
            $(this).attr('data-intersection', '[' + intersection_data[0] + ',' + intersection_data[1] + ',' + intersection_data[2] + ',' + intersection_data[3] + ']');
        };
        elment.try_set_intersection = function () {
            var intersection_data = this.create_intersection();
            var old_data = $(this).attr('data-intersection');          
            $(this).attr('data-intersection', '[' + intersection_data[0] + ',' + intersection_data[1] + ',' + intersection_data[2] + ',' + intersection_data[3] + ']');
            var canDo = this.check_intersection();
            if (!canDo) {
                $(this).attr('data-intersection', old_data);
            }
            return canDo;
        };
        elment.check_intersection = function () {
            return true;

            var isPointInPolegon = function (point, poligon) {
                var x = point[0], y = point[1];
                var x1 = poligon[0];
                var y1 = poligon[1];
                var x2 = x1 + poligon[2];
                var y2 = y1 + poligon[3];
                return (x1 < x && x < x2) && (y1 < y && y < y2);
            };
            var isPoligonCut = function (p1, p2) {
                var isCut = isPointInPolegon([p2[0], p2[1]], p1) ||
                    isPointInPolegon([(p2[0] + p2[2]), p2[1]], p1) ||
                    isPointInPolegon([p2[0], (p2[1] + p2[3])], p1) ||
                    isPointInPolegon([(p2[0] + p2[2]), (p2[1] + p2[3])], p1) ||
                    isPointInPolegon([p1[0], p1[1]], p2) ||
                    isPointInPolegon([(p1[0] + p1[2]), (p1[1] + p1[3])], p2);
                if (isCut) {
                    return true;
                }
                return (p1[0] == p2[0] && p1[2] == p2[2] && p1[1] == p2[1] && p1[3] == p2[3]) ||
                    (p1[0] == p2[0] && p1[2] == p2[2] && (((p2[1] < p1[1] && p1[1] < (p2[1] + p2[3])) || (p2[1] < (p1[1] + p1[3]) && (p1[1] + p1[3]) < (p2[1] + p2[3]))) || ((p1[1] < p2[1] && p2[1] < (p1[1] + p1[3])) || (p1[1] < (p2[1] + p2[3]) && (p2[1] + p2[3]) < (p1[1] + p1[3]))))) ||
                    (p1[1] == p2[1] && p1[3] == p2[3] && (((p2[0] < p1[0] && p1[0] < (p2[0] + p2[2])) || (p2[0] < (p1[0] + p1[2]) && (p1[0] + p1[2]) < (p2[0] + p2[2]))) || ((p1[0] < p2[0] && p2[0] < (p1[0] + p1[2])) || (p1[0] < (p2[0] + p2[2]) && (p2[0] + p2[2]) < (p1[0] + p1[2])))));
            }

            var intersection_data = eval($(this).attr('data-intersection'));
            var intersection_items = $(this).siblings();
            for (var i = 0; i < intersection_items.length; i++) {
                var i_d = eval($(intersection_items[i]).attr('data-intersection'));
                var isHook = isPoligonCut(i_d, intersection_data);
                if (isHook) {
                    return false;
                }
            }
            return true;
        };
        elment.create_intersection = function () {
            var e = $(this);
            var desktop = chemicalGeneratorContainer.find('.ChemicalGenerator-desktop').first();
            var dw = Math.round(desktop.width() / fontSize);
            var dh = Math.round(desktop.height() / fontSize);
            var offset = e.offset();
            var offsetD = desktop.offset();

            var left = offset.left - offsetD.left;
            var top = offset.top - offsetD.top;

            var leftEM = Math.round(left / fontSize);
            var topEM = Math.round(top / fontSize);
            var leftD = leftEM % desktopGridItemSize;
            var topD = topEM % desktopGridItemSize;
            if (leftD > 2) {
                leftEM += desktopGridItemSize;
            }
            if (topD > 2) {
                topEM += desktopGridItemSize;
            }
            leftEM -= leftD;
            topEM -= topD;
            var width = e.outerWidth() / fontSize;
            var width1 = width - (width % desktopGridItemSize);
            if (width != width1) {
                width = width1 + desktopGridItemSize;
            }
            else {
                width = width1;
            }
            var height = e.outerHeight() / fontSize;
            var height1 = height - (height % desktopGridItemSize);
            //height1 = Math.floor(height / desktopGridItemSize) * desktopGridItemSize;
            if (height != height1) {
                height = height1 + desktopGridItemSize;
            }
            else {
                height = height1;
            }

            //height = 5 * desktopGridItemSize;// Math.ceil((e.outerHeight() / fontSize) / desktopGridItemSize) * desktopGridItemSize;

            if (leftEM < 0) {
               leftEM = 0;
            }
            else if (leftEM + width > dw) {
                leftEM = dw - width;
            }
            if (topEM < 0) {
                topEM = 0;
            }
            else if (topEM + height > dh) {
                topEM = dh - height;
            }

            var intersection_data = [
                Math.round(leftEM / desktopGridItemSize),
                Math.round(topEM / desktopGridItemSize),
                Math.round(width / desktopGridItemSize),
                Math.round(height / desktopGridItemSize)
            ];
            return intersection_data;
        };
    };

    var setProcessDraggable = function (proces) {
        proces[0].set_intersection();

        proces.draggable({
            containment: ".ChemicalGenerator-desktop",
            start: function (event, ui) {
                if (selectedTab == "chemicalProcess" || selectedTab == "HessLaw" || selectedTab == "EnergyGraph" || selectedTab == "calcTable") {
                    draggetStart = {
                        top: Math.round(ui.position.top / fontSize),
                        left: Math.round(ui.position.left / fontSize)
                    };
                }
                else
                    return false;
            },
            stop: function (event, ui) {
                if ($(this).is('.isrevert')) {
                    $(this).removeClass('isrevert');
                    var old_intersection_data = eval($(this).attr('data-intersection'));
                    $(this).animate({
                        left: (old_intersection_data[0] * desktopGridItemSize) + 'em',
                        top: (old_intersection_data[1] * desktopGridItemSize) + 'em'
                    }, 100);
                    return;
                }

                this.try_set_intersection();
                var intersection_data = eval($(this).attr('data-intersection'));
                $(this).animate({
                    left: (intersection_data[0] * desktopGridItemSize) + 'em',
                    top: (intersection_data[1] * desktopGridItemSize) + 'em'
                }, 100);
            }
        });
    };

    var creatFragment = function (connectType) {
        var newFragment = $('<div class="ChemicalGenerator-desktop_chemicalProces-fragment">\
                            <div class="ChemicalGenerator-desktop_chemicalProces-fragment--center"></div>\
                            <div class="ChemicalGenerator-desktop_chemicalProces-fragment--top"></div>\
                            <div class="ChemicalGenerator-desktop_chemicalProces-fragment--bottom"></div>\
                            <div class="ChemicalGenerator-desktop_chemicalProces-fragment--center2"></div>\
                          </div>');
        var s_center = creatSegment(connectType),
            s_center2 = creatSegment(''),
            s_top = creatSegment(''),
            s_bottom = creatSegment('');
        newFragment.find('.ChemicalGenerator-desktop_chemicalProces-fragment--center').html(s_center);
        newFragment.find('.ChemicalGenerator-desktop_chemicalProces-fragment--center2').html(s_center2);
        newFragment.find('.ChemicalGenerator-desktop_chemicalProces-fragment--top').html(s_top);
        newFragment.find('.ChemicalGenerator-desktop_chemicalProces-fragment--bottom').html(s_bottom);

        if (isNaN(parseInt(connectType)) && connectType != '' && connectType != '==>' && connectType != '.' && connectType != 'e⁻' && connectType.trim() != '' && connectType != '&nbsp;&nbsp;&nbsp;' && connectType != '(' && connectType != ')' && specialKeyboardSigns.indexOf(connectType) === -1 ) {
            s_center.attr('data-oxidation', connectType);
        }

        return newFragment;
    };

    var creatSegment = function (content) {
        var newSegment = $('<div class="ChemicalGenerator-desktop_chemicalProces-segment"></div>');
        if (content == '') {
            newSegment.addClass('ChemicalGenerator-desktop_chemicalProces-segment--empty');
            newSegment.attr('data-content', '');
        }
        else {
            newSegment.html(content);
            newSegment.append('<div class="ChemicalGenerator-desktop_chemicalProces-segment-preTriger"></div>');
            newSegment.attr('data-content', content);
        }
        return newSegment;
    };

    var setDegreesOfOxidationPosition = function (degreesOfOxidation, animate) {
        var setPosition = function () {
            var sTemp1 = null, sTemp2 = null, prosses, resizeDom;

            prosses = degreesOfOxidation.closest('.ChemicalGenerator-desktop_chemicalProces');
            resizeDom = degreesOfOxidation.find('.ChemicalGenerator-desktop_degreesOfOxidation-resize');

            var oxidationIndex = degreesOfOxidation.attr('data-oxidationIndex');
            var sigments = prosses.find('.ChemicalGenerator-desktop_chemicalProces-segment[data-oxidation][data-oxidationIndex="' + oxidationIndex + '"]');
            if (sigments.length > 0) {
                sTemp1 = sigments.eq(0);
            }
            if (sigments.length > 1) {
                sTemp2 = sigments.eq(1);
            }

            var w = 0, left = 0;

            if (resizeDom.length == 0) {
                if (sTemp1 == null) {
                    trashAnimate();
                    sigments.removeAttr('data-oxidationIndex');
                    sigments.removeAttr('data-oxidationTempIndex');
                    degreesOfOxidation.remove();
                    return;
                }

                var s1L = sTemp1.offset().left;
                var pL = prosses.offset().left;
                var left1 = ((s1L - pL) + (sTemp1.width() / 2));
                left = left1 / fontSize;

            }
            else {
                if (sTemp1 == null || sTemp2 == null) {
                    deleteDegreeOfOxidation(degreesOfOxidation, false);
                    return;
                }

                var s1L = sTemp1.offset().left;
                var s2L = sTemp2.offset().left;
                var pL = prosses.offset().left;
                var left1 = ((s1L - pL) + (sTemp1.width() / 2));
                var left2 = ((s2L - pL) + (sTemp2.width() / 2));
                w = (left2 - left1) / fontSize;
                left = left1 / fontSize;
                var extraOxidationStartsFrom = resizeDom.closest('.ChemicalGenerator-desktop_degreesOfOxidation').attr('extra_oxidation');
                if (extraOxidationStartsFrom != undefined) {
                    var es = prosses.find('.ChemicalGenerator-desktop_chemicalProces-segment[data-oxidation][data-oxidationextraindex="' + oxidationIndex + '"]');
                    if (es.length > 0) {
                        var esLeft = ((es.offset().left - pL) + (es.width() / 2));
                        var esWidth;
                        if (extraOxidationStartsFrom == 'left') {
                            esWidth = (esLeft - left1) / fontSize;
                        }
                        else {
                            esWidth = (left2 - esLeft) / fontSize;
                        }
                        resizeDom.closest('.ChemicalGenerator-desktop_degreesOfOxidation').find('.ChemicalGenerator-desktop_degreesOfOxidation_extra').css({
                            width: esWidth + 'em'
                        })
                    }
                    else {
                        resizeDom.closest('.ChemicalGenerator-desktop_degreesOfOxidation').removeAttr('extra_oxidation');
                        resizeDom.closest('.ChemicalGenerator-desktop_degreesOfOxidation').find('.ChemicalGenerator-desktop_degreesOfOxidation_extra').remove();
                    }

                }
            }

            if (animate) {
                resizeDom.animate({
                    width: w + 'em'
                });
                degreesOfOxidation.animate({
                    left: left + 'em'
                });
            }
            else {
                resizeDom.css({
                    width: w + 'em'
                });
                degreesOfOxidation.css({
                    left: left + 'em',
                    opacity: "1"
                });
            }
        };

        if (animate) {
            setPosition();
        }
        else {
            setTimeout(setPosition, 10);
        }
    };

    var creatDegreesOfOxidation = function (single) {
        if (single != undefined && single == true) {
            var degreesOfOxidation = '<div class="ChemicalGenerator-desktop_degreesOfOxidation">\
							  <div class="ChemicalGenerator-desktop_degreesOfOxidation-num ChemicalGenerator-desktop_degreesOfOxidation-num--left ChemicalGenerator-desktop_degreesOfOxidation-num--0">\
								<div class="ChemicalGenerator-desktop_degreesOfOxidation-num-input"><input type="text"  /></div>\
								<div class="ChemicalGenerator-desktop_degreesOfOxidation-num-input-left"><input type="text" maxlength="2" /></div>\
							  </div>\
                             <div class="ChemicalGenerator-desktop_degreesOfOxidation-delete"></div>\
            <div class="ChemicalGenerator-desktop_degreesOfOxidation-add ChemicalGenerator-desktop_degreesOfOxidation-add-single" add_from="left"><span>+</span></div>\
						 </div>';
            degreesOfOxidation = $(degreesOfOxidation);
        }
        else {
            var degreesOfOxidation = '<div class="ChemicalGenerator-desktop_degreesOfOxidation">\
                                <div class="ChemicalGenerator-desktop_degreesOfOxidation-resize">\
                                  <div class="ChemicalGenerator-desktop_degreesOfOxidation-resize-top">\
                                    <div class="ChemicalGenerator-desktop_degreesOfOxidation-add" add_from="left"><span>+</span></div>\
                                    <div class="ChemicalGenerator-desktop_degreesOfOxidation-add" add_from="right"><span>+</span></div>\
                                  </div>\
                                  <div class="ChemicalGenerator-desktop_degreesOfOxidation-resize-left"></div>\
                                  <div class="ChemicalGenerator-desktop_degreesOfOxidation-resize-right"></div>\
                                </div>\
                                <div class="ChemicalGenerator-desktop_degreesOfOxidation-num ChemicalGenerator-desktop_degreesOfOxidation-num--left ChemicalGenerator-desktop_degreesOfOxidation-num--0">\
                                  <div class="ChemicalGenerator-desktop_degreesOfOxidation-num-input"><input type="text" /></div>\
                                  <div class="ChemicalGenerator-desktop_degreesOfOxidation-num-input-left"><input type="text" maxlength="2" /></div>\
                                </div>\
                                <div class="ChemicalGenerator-desktop_degreesOfOxidation-num ChemicalGenerator-desktop_degreesOfOxidation-num--right ChemicalGenerator-desktop_degreesOfOxidation-num--0">\
                                  <div class="ChemicalGenerator-desktop_degreesOfOxidation-num-input"><input type="text"  /></div>\
                                   <div class="ChemicalGenerator-desktop_degreesOfOxidation-num-input-left"><input type="text" maxlength="2" /></div>\
                                </div>\
                                <div class="ChemicalGenerator-desktop_degreesOfOxidation-input"><input type="text" special_input_keys="e⁻"  maxlength="15"></div>\
                                <div class="ChemicalGenerator-desktop_degreesOfOxidation-delete"></div>\
                             </div>';
            degreesOfOxidation = $(degreesOfOxidation);
            var input_container = degreesOfOxidation.find('.ChemicalGenerator-desktop_degreesOfOxidation-input');
            appendSpecialKeyBoard(input_container, 'e⁻');

            var resizeTop = degreesOfOxidation.find('.ChemicalGenerator-desktop_degreesOfOxidation-resize .ChemicalGenerator-desktop_degreesOfOxidation-resize-top')[0];
            resizeTop.onmousedown = function (e) {
                e = e || window.event;
                e.preventDefault();
                protectUp = true;

                chemicalGeneratorContainer.attr('data-resize', 'n');

                var resizeDom = $(resizeTop).closest('.ChemicalGenerator-desktop_degreesOfOxidation-resize');
                var prosses = resizeDom.closest('.ChemicalGenerator-desktop_chemicalProces');
                var degreesOfOxidation = resizeDom.closest('.ChemicalGenerator-desktop_degreesOfOxidation');
                var isBottom = degreesOfOxidation.is('.ChemicalGenerator-desktop_degreesOfOxidation--bottom');
                var resizeTopStartM = e.clientY;

                if ('__clientY' in e) {
                    var resizeTopStartM = e.__clientY;
                }

                var resizeStartH = resizeDom.height();
                var dH = 0;
                if (!degreesOfOxidation.is('.ChemicalGenerator-desktop_degreesOfOxidation--can_resize')) {
                    chemicalGeneratorContainer.find('.ChemicalGenerator-desktop_degreesOfOxidation--can_resize').removeClass('ChemicalGenerator-desktop_degreesOfOxidation--can_resize');
                    degreesOfOxidation.addClass('ChemicalGenerator-desktop_degreesOfOxidation--can_resize');
                }

                var onmousemove = function (e1) {
                    dH = resizeTopStartM - e1.clientY;
                    var h = resizeStartH + dH;
                    if (isBottom) {
                        h = resizeStartH - dH;
                    }

                    if (h < -(5.9 * fontSize)) {
                        isBottom = !isBottom;
                        if (isBottom) {
                            degreesOfOxidation.addClass('ChemicalGenerator-desktop_degreesOfOxidation--bottom');
                        }
                        else {
                            degreesOfOxidation.removeClass('ChemicalGenerator-desktop_degreesOfOxidation--bottom');
                        }
                        resizeStartH = 2 * fontSize;
                        dH = 0;
                        onmouseup();
                        e1.__clientY = $(resizeTop).offset().top + 3;
                        resizeTop.onmousedown(e1);
                        return;
                    }

                    if (h < 2 * fontSize) {
                        h = 2 * fontSize;
                    }
                    resizeDom.height(h);
                };

                var onmouseup = function (e1) {
                    var h = (resizeStartH + dH) / fontSize;
                    if (isBottom) {
                        h = (resizeStartH - dH) / fontSize;
                    }
                    if (h < 2) {
                        h = 2;
                    }
                    resizeDom.height(h + 'em');
                    chemicalGeneratorContainer.attr('data-resize', '');
                    document.onmouseup = null;
                    document.onmousemove = null;
                };

                document.onmouseup = onmouseup;
                document.onmousemove = onmousemove;
            };

            var getClosestSigment = function (left, oxidationIndex, sigments) {
                //return $(sigments[sigments.length - 1]);

                var startS = sigments.sigments.filter('.ChemicalGenerator-desktop_chemicalProces-segment[data-oxidationTempIndex="' + oxidationIndex + '"]');
                if (startS.length == 0) {
                    return null;
                }
                var _Index = sigments.sigments.index(startS);
                var maxIndex = sigments.sigments.length - 1;
                if (left >= sigments.data[_Index].left && left <= sigments.data[_Index].right) {
                    return startS;
                }
                var d = (left < sigments.data[_Index].left) ? -1 : 1;
                _Index += d;
                while (_Index >= 0 && _Index <= maxIndex) {
                    var _s = sigments.sigments.eq(_Index);
                    if (left >= sigments.data[_Index].left && left <= sigments.data[_Index].right) {
                        return _s;
                    }
                    if (d > 0 && left >= sigments.data[_Index - d].right && left <= sigments.data[_Index].left) {
                        var result = ((sigments.data[_Index].left - left) < (left - sigments.data[_Index - d].right)) ? _s : startS;
                        return result;

                    }
                    else if (d < 0 && left >= sigments.data[_Index].right && left <= sigments.data[_Index - d].left) {
                        var result = ((sigments.data[_Index - d].left - left) > (left - sigments.data[_Index].right)) ? _s : startS;
                        return result;
                    }

                    startS = _s;
                    _Index += d;
                }
                return startS;
            };


            var resizeRight = degreesOfOxidation.find('.ChemicalGenerator-desktop_degreesOfOxidation-resize .ChemicalGenerator-desktop_degreesOfOxidation-resize-right')[0];
            resizeRight.onmousedown = function (e) {
                var resizeDom = $(resizeTop).closest('.ChemicalGenerator-desktop_degreesOfOxidation-resize');
                e = e || window.event;
                e.preventDefault();
                if (resizeDom.closest('.ChemicalGenerator-desktop_degreesOfOxidation').attr('extra_oxidation') != undefined && resizeDom.closest('.ChemicalGenerator-desktop_degreesOfOxidation').attr('extra_oxidation') == 'right') {
                    return;
                }
                protectUp = true;


                var prosses = resizeDom.closest('.ChemicalGenerator-desktop_chemicalProces');
                var degreesOfOxidation = resizeDom.closest('.ChemicalGenerator-desktop_degreesOfOxidation');
                if (!degreesOfOxidation.is('.ChemicalGenerator-desktop_degreesOfOxidation--can_resize')) {
                    chemicalGeneratorContainer.find('.ChemicalGenerator-desktop_degreesOfOxidation--can_resize').removeClass('ChemicalGenerator-desktop_degreesOfOxidation--can_resize');
                    degreesOfOxidation.addClass('ChemicalGenerator-desktop_degreesOfOxidation--can_resize');
                }

                var oxidationIndex = degreesOfOxidation.attr('data-oxidationIndex');
                var sigments = prosses.find('.ChemicalGenerator-desktop_chemicalProces-segment[data-oxidation][data-oxidationIndex="' + oxidationIndex + '"]');
                var s1 = null, s2 = null;
                var sTemp1 = null, sTemp2 = null;
                if (sigments.length > 0) {
                    s1 = sigments.eq(0);
                    sTemp1 = s1;
                }
                if (sigments.length > 1) {
                    s2 = sigments.eq(1);
                    sTemp2 = s2;
                }
                if (s1 == null || s2 == null) {
                    return;
                }

                s2.removeAttr("data-oxidationIndex");
                sTemp2.attr('data-oxidationTempIndex', oxidationIndex);
                var freeSigments = prosses.find('.ChemicalGenerator-desktop_chemicalProces-segment[data-oxidation]:not([data-oxidationIndex]):not([data-oxidationextraindex]), .ChemicalGenerator-desktop_chemicalProces-segment[data-oxidation][data-oxidationIndex="' + oxidationIndex + '"]');
                var s1Index = freeSigments.index(s1);
                freeSigments = freeSigments.filter('.ChemicalGenerator-desktop_chemicalProces-segment:gt(' + s1Index + ')');
                freeSigments = getSigmentPoditionData(freeSigments);

                var resizeLeftStartM = e.clientX;
                var resizeStartW = resizeDom.width();
                var resizeLeftP = s1.offset().left + (s1.width() / 2);
                var dW = 0;

                chemicalGeneratorContainer.attr('data-resize', 'e');

                var onmousemove = function (e1) {
                    dW = resizeLeftStartM - e1.clientX;
                    var w = resizeStartW - dW;
                    if (w < 3 * fontSize) {
                        w = 3 * fontSize;
                    }


                    var _sTemp2 = getClosestSigment((resizeLeftP + w), oxidationIndex, freeSigments);
                    if (_sTemp2 != null) {
                        sTemp2.removeAttr("data-oxidationTempIndex");
                        sTemp2 = _sTemp2;
                        sTemp2.attr('data-oxidationTempIndex', oxidationIndex);
                    }
                    resizeDom.width(w);
                };
                var onmouseup = function (e1) {
                    sTemp2.removeAttr("data-oxidationTempIndex");
                    sTemp2.attr('data-oxidationIndex', oxidationIndex);

                    setDegreesOfOxidationPosition(degreesOfOxidation, true);

                    chemicalGeneratorContainer.attr('data-resize', '');
                    document.onmouseup = null;
                    document.onmousemove = null;
                };

                document.onmouseup = onmouseup;
                document.onmousemove = onmousemove;
            };

            var resizeLeft = degreesOfOxidation.find('.ChemicalGenerator-desktop_degreesOfOxidation-resize .ChemicalGenerator-desktop_degreesOfOxidation-resize-left')[0];
            resizeLeft.onmousedown = function (e) {
                e = e || window.event;
                e.preventDefault();
                var resizeDom = $(resizeTop).closest('.ChemicalGenerator-desktop_degreesOfOxidation-resize');
                if (resizeDom.closest('.ChemicalGenerator-desktop_degreesOfOxidation').attr('extra_oxidation') != undefined && resizeDom.closest('.ChemicalGenerator-desktop_degreesOfOxidation').attr('extra_oxidation') == 'left') {
                    return;
                }

                protectUp = true;

                //var resizeDom = $(resizeTop).closest('.ChemicalGenerator-desktop_degreesOfOxidation-resize');
                var prosses = resizeDom.closest('.ChemicalGenerator-desktop_chemicalProces');
                var degreesOfOxidation = resizeDom.closest('.ChemicalGenerator-desktop_degreesOfOxidation');
                if (!degreesOfOxidation.is('.ChemicalGenerator-desktop_degreesOfOxidation--can_resize')) {
                    chemicalGeneratorContainer.find('.ChemicalGenerator-desktop_degreesOfOxidation--can_resize').removeClass('ChemicalGenerator-desktop_degreesOfOxidation--can_resize');
                    degreesOfOxidation.addClass('ChemicalGenerator-desktop_degreesOfOxidation--can_resize');
                }

                var oxidationIndex = degreesOfOxidation.attr('data-oxidationIndex');
                var sigments = prosses.find('.ChemicalGenerator-desktop_chemicalProces-segment[data-oxidation][data-oxidationIndex="' + oxidationIndex + '"]');
                var s1 = null, s2 = null;
                var sTemp1 = null, sTemp2 = null;
                if (sigments.length > 0) {
                    s1 = sigments.eq(0);
                    sTemp1 = s1;
                }
                if (sigments.length > 1) {
                    s2 = sigments.eq(1);
                    sTemp2 = s2;
                }
                if (s1 == null || s2 == null) {
                    return;
                }

                s1.removeAttr("data-oxidationIndex");
                sTemp1.attr('data-oxidationTempIndex', oxidationIndex);
                var freeSigments = prosses.find('.ChemicalGenerator-desktop_chemicalProces-segment[data-oxidation]:not([data-oxidationIndex]):not([data-oxidationextraindex]), .ChemicalGenerator-desktop_chemicalProces-segment[data-oxidation][data-oxidationIndex="' + oxidationIndex + '"]');
                var s2Index = freeSigments.index(s2);
                freeSigments = freeSigments.filter('.ChemicalGenerator-desktop_chemicalProces-segment:lt(' + s2Index + ')');
                freeSigments = getSigmentPoditionData(freeSigments);

                var resizeLeftStartM = e.clientX;
                var resizeStartW = resizeDom.width();
                var resizeLeftP = s1.offset().left + (s1.width() / 2);
                var resizeRightP = s2.offset().left + (s2.width() / 2);
                var prossesLeft = prosses.offset().left;
                var dW = 0;

                chemicalGeneratorContainer.attr('data-resize', 'e');

                var onmousemove = function (e1) {
                    dW = resizeLeftStartM - e1.clientX;
                    var w = resizeStartW + dW;
                    if (w < 3 * fontSize) {
                        w = 3 * fontSize;
                    }
                    var left = resizeRightP - w;

                    var _sTemp1 = getClosestSigment(left, oxidationIndex, freeSigments);
                    if (_sTemp1 != null) {
                        sTemp1.removeAttr("data-oxidationTempIndex");
                        sTemp1 = _sTemp1;
                        sTemp1.attr('data-oxidationTempIndex', oxidationIndex);
                    }
                    resizeDom.width(w);
                    degreesOfOxidation.css("left", (left - prossesLeft) + "px");
                };
                var onmouseup = function (e1) {
                    sTemp1.removeAttr("data-oxidationTempIndex");
                    sTemp1.attr('data-oxidationIndex', oxidationIndex);

                    setDegreesOfOxidationPosition(degreesOfOxidation, true);

                    chemicalGeneratorContainer.attr('data-resize', '');
                    document.onmouseup = null;
                    document.onmousemove = null;
                };

                document.onmouseup = onmouseup;
                document.onmousemove = onmousemove;
            };
        }


        degreesOfOxidation.on('mousedown', '[add_from]', function (e) {
            var cur_direction = $(this).attr('add_from');
            var mainLine = $(this).parents('.ChemicalGenerator-desktop_degreesOfOxidation.ChemicalGenerator-desktop_degreesOfOxidation--can_resize');
            var dom;
            if ($(this).hasClass('ChemicalGenerator-desktop_degreesOfOxidation-add-single')) {
                dom = createSingleOxidation(mainLine, cur_direction);
                resizeSingle(dom, e);
                mainLine.addClass('onmove_hide');
            }
            else {

                dom = createExtraOxidation(mainLine, cur_direction);
                dom.find('.ChemicalGenerator-desktop_degreesOfOxidation-input input').setInputTextSize(true);
                resizeExtra(dom, e);
            }
        })

        degreesOfOxidation.on('change', '.ChemicalGenerator-desktop_degreesOfOxidation-num .ChemicalGenerator-desktop_degreesOfOxidation-num-input input', function () {
            var item = $(this);
            var new_value = $(this).val();
            var val = getDegreeNum(new_value);
            item.val(val);
            setDegreeEmptyStyle(item.closest('.ChemicalGenerator-desktop_degreesOfOxidation-num'));

        });

        degreesOfOxidation.on('click', '.ChemicalGenerator-desktop_degreesOfOxidation-delete', function (e) {
            deleteDegreeOfOxidation(degreesOfOxidation, e);
        });

        degreesOfOxidation.on('focus', 'input', function () {
            if (selectedTab != "degreesOfOxidation" && selectedTab != "degreeOfOxidation") {
                $(this).blur();
            };
        });

        degreesOfOxidation[0].onclick = function (e) {
            e = e || window.event;
            e.preventDefault();

            if (!$(this).is('.ChemicalGenerator-desktop_degreesOfOxidation--can_resize')) {
                chemicalGeneratorContainer.find('.ChemicalGenerator-desktop_degreesOfOxidation--can_resize').removeClass('ChemicalGenerator-desktop_degreesOfOxidation--can_resize');
                $(this).addClass('ChemicalGenerator-desktop_degreesOfOxidation--can_resize');
            }
        };

        return degreesOfOxidation;
    }

    function getDegreeNum(new_val) {
        new_val = new_val + "";
        new_val = new_val.replace('−', '-');
        var val = parseInt(new_val);
        if (isNaN(val)) {
            val = "";
        }
        else {
            if (val > 7) {
                val = 7;
            }
            else if (val < -7) {
                val = -7;
            }
            if (val == 0) {
                val = val;
            }
            else if (val > 0) {
                val = "+" + val;
            }
            else {
                val = "−" + (-val);
            }
        }
        return val;
    }
    function addExtraOxidation(currentOxidation) {
        var cur_direction = currentOxidation.extraoxidation.extra_starts_from; // $(this).attr('add_from');
        var mainLine = currentOxidation.oxidation;
        var dom = createExtraOxidation(mainLine, cur_direction);
        if (currentOxidation.extraoxidation.text_extra != undefined) {
            dom.find('.ChemicalGenerator-desktop_degreesOfOxidation-input input').val(currentOxidation.extraoxidation.text_extra);
        }
        if (currentOxidation.extraoxidation.extra_num_input != undefined) {
            var numE = getDegreeNum(currentOxidation.extraoxidation.extra_num_input);
            dom.find('.ChemicalGenerator-desktop_degreesOfOxidation-num  .ChemicalGenerator-desktop_degreesOfOxidation-num-input input').val(numE);
            setDegreeEmptyStyle(dom.find('.ChemicalGenerator-desktop_degreesOfOxidation-num'));
            dom.find('.ChemicalGenerator-desktop_degreesOfOxidation-input input').setInputTextSize(true);
        }
        if (currentOxidation.extraoxidation.extra_num_input_left != undefined) {
            dom.find('.ChemicalGenerator-desktop_degreesOfOxidation-num  .ChemicalGenerator-desktop_degreesOfOxidation-num-input-left input').val(currentOxidation.extraoxidation.extra_num_input_left);
        }
    }
    function createExtraOxidation(mainLine, cur_direction) {
        mainLine.attr('extra_oxidation', cur_direction);
        var dom = '<div class="ChemicalGenerator-desktop_degreesOfOxidation_extra" startsFrom="' + cur_direction + '">\
                                            <div class="ChemicalGenerator-desktop_degreesOfOxidation_extra_drag" ></div>\
                                            <div class="ChemicalGenerator-desktop_degreesOfOxidation-num ChemicalGenerator-desktop_degreesOfOxidation-num--extra ChemicalGenerator-desktop_degreesOfOxidation-num--0">\
                                                  <div class="ChemicalGenerator-desktop_degreesOfOxidation-num-input"><input type="text"  maxlength="2"/></div>\
                                                  <div class="ChemicalGenerator-desktop_degreesOfOxidation-num-input-left"><input type="text" maxlength="2" /></div>\
                                             </div>\
                  <div class="ChemicalGenerator-desktop_degreesOfOxidation-input"><input type="text" special_input_keys="e⁻" maxlength="15"></div>\
                                             <div class="ChemicalGenerator-desktop_degreesOfOxidation-delete"></div>\
                            </div>';
        dom = $(dom);
        mainLine.prepend(dom);
        intiExtraOxidationEvent(mainLine);
        var input_container = dom.find('.ChemicalGenerator-desktop_degreesOfOxidation-input');
        appendSpecialKeyBoard(input_container, 'e⁻');
        return dom;
    }
    function createSingleOxidation(mainLine, cur_direction) {
        mainLine.attr('extra_oxidation', cur_direction);
        var dom = '<div class="ChemicalGenerator-desktop_degreesOfOxidation_extra" startsFrom="' + cur_direction + '">\
                                            <div class="ChemicalGenerator-desktop_degreesOfOxidation_extra_drag" ></div>\
                                            <div class="ChemicalGenerator-desktop_degreesOfOxidation-num ChemicalGenerator-desktop_degreesOfOxidation-num--extra ChemicalGenerator-desktop_degreesOfOxidation-num--0">\
                                                  <div class="ChemicalGenerator-desktop_degreesOfOxidation-num-input"><input type="text"   maxlength="2"/></div>\
                                                  <div class="ChemicalGenerator-desktop_degreesOfOxidation-num-input-left"><input type="text" maxlength="2" /></div>\
                                             </div>\
                  </div>';
        dom = $(dom);
        mainLine.prepend(dom);
        return dom;
    }
    var getClosestSigmentForExtra = function (left, oxidationIndex, sigments) {
        var startS = sigments.sigments.filter('.ChemicalGenerator-desktop_chemicalProces-segment[data-oxidationTempextraIndex="' + oxidationIndex + '"]');
        if (startS.length == 0) {
            return null;
        }
        var _Index = sigments.sigments.index(startS);
        var maxIndex = sigments.sigments.length - 1;
        if (left >= sigments.data[_Index].left && left <= sigments.data[_Index].right) {
            return startS;
        }

        var d = (left < sigments.data[_Index].left) ? -1 : 1;
        _Index += d;
        if (_Index < 0 || _Index > maxIndex) {
            _Index -= d;
            return startS;
        }

        while (_Index >= 0 && _Index <= maxIndex) {

            var _s = sigments.sigments.eq(_Index);
            if (left >= sigments.data[_Index].left && left <= sigments.data[_Index].right) {
                return _s;
            }
            if (d > 0 && left >= sigments.data[_Index - d].right && left <= sigments.data[_Index].left) {
                var result = ((sigments.data[_Index].left - left) < (left - sigments.data[_Index - d].right)) ? _s : startS;
                return result;

            }
            else if (d < 0 && left >= sigments.data[_Index].right && left <= sigments.data[_Index - d].left) {
                var result = ((sigments.data[_Index - d].left - left) > (left - sigments.data[_Index].right)) ? _s : startS;
                return result;
            }

            startS = _s;
            _Index += d;
        }

        return startS;
    };

    var getSigmentPoditionData = function (sigments) {
        var data = [];
        for (var i = 0; i < sigments.length; i++) {
            var sigment = sigments.eq(i);
            var offset = sigment.offset();
            var left = offset.left;
            var right = offset.left + sigment.width();
            var center = (left + right) / 2;
            data.push({
                left: left,
                right: right,
                center: center
            });
        }
        return {
            sigments: sigments,
            data: data
        };
    };

    var intiExtraOxidationEvent = function (mainLine) {
        var extraOxy = mainLine.find('.ChemicalGenerator-desktop_degreesOfOxidation_extra_drag').eq(0);
        extraOxy.on('mousedown', function (e) {
            var resizeDom = $(e.target).parents(".ChemicalGenerator-desktop_degreesOfOxidation_extra");
            resizeExtra(resizeDom, e);
        });
    }

    var resizeSingle = function (dom, e) {
        e = e || window.event;
        e.preventDefault();
        protectUp = true;

        var resizeExtra = dom;
        var resizeDom = dom.parents('.ChemicalGenerator-desktop_degreesOfOxidation');

        var prosses = resizeDom.closest('.ChemicalGenerator-desktop_chemicalProces');
        var degreesOfOxidation = resizeDom.closest('.ChemicalGenerator-desktop_degreesOfOxidation');
        if (!degreesOfOxidation.is('.ChemicalGenerator-desktop_degreesOfOxidation--can_resize')) {
            chemicalGeneratorContainer.find('.ChemicalGenerator-desktop_degreesOfOxidation--can_resize').removeClass('ChemicalGenerator-desktop_degreesOfOxidation--can_resize');
            degreesOfOxidation.addClass('ChemicalGenerator-desktop_degreesOfOxidation--can_resize');
        }

        var oxidationIndex = degreesOfOxidation.attr('data-oxidationIndex');
        var sigments = prosses.find('.ChemicalGenerator-desktop_chemicalProces-segment[data-oxidation][data-oxidationIndex="' + oxidationIndex + '"]');
        var sTemp3 = null;
        sTemp3 = sigments.eq(0);
        sTemp3.attr('data-oxidationTempextraIndex', oxidationIndex);

        var allSegments = prosses.find('.ChemicalGenerator-desktop_chemicalProces-segment[data-oxidation]');
        allSegments = getSigmentPoditionData(allSegments);
        var resizeLeftStartM = e.clientX;
        var resizeStartW = resizeExtra.width();
        var dW = 0;
        var startsFrom = 'left';

        chemicalGeneratorContainer.attr('data-resize', 'e');

        var onmousemove = function (e1) {
            dW = resizeLeftStartM - e1.clientX;
            var w = startsFrom == 'left' ? (resizeStartW - dW) : (resizeStartW + dW);

            if (w < 3 * fontSize) {
                if (startsFrom == 'left' && dW > 0) {
                    resizeExtra.attr('startsfrom', 'right');
                    startsFrom = 'right';
                    resizeExtra.closest('.ChemicalGenerator-desktop_degreesOfOxidation').attr('extra_oxidation', 'right');
                }
                else if (startsFrom == 'right' && dW < 0) {
                    resizeExtra.attr('startsfrom', 'left');
                    resizeExtra.closest('.ChemicalGenerator-desktop_degreesOfOxidation').attr('extra_oxidation', 'left');
                    startsFrom = 'left';
                }
            }

            var _sTemp3 = getClosestSigmentForExtra(resizeExtra.find('.ChemicalGenerator-desktop_degreesOfOxidation_extra_drag').offset().left, oxidationIndex, allSegments);
            if (_sTemp3 != null) {
                if (sTemp3 != null) {
                    sTemp3.removeAttr("data-oxidationTempextraIndex");
                }
                sTemp3 = _sTemp3;
                sTemp3.attr('data-oxidationTempextraIndex', oxidationIndex);
            }
            resizeExtra.width(w);
        };
        var onmouseup = function (e1) {
            degreesOfOxidation.removeClass('onmove_hide');
            var degreesOfOxidationNew;

            if (sTemp3 != null) {
                var oldOxidationIndex = $(sTemp3[0]).attr('data-oxidationindex');
                var oldExtraOxidationIndex = $(sTemp3[0]).attr('data-oxidationextraindex');
                var addedOxydation = false;
                if (oldOxidationIndex == undefined && oldExtraOxidationIndex == undefined) {  //1:to do create degree of oxydation
                    sTemp3.attr('data-oxidationindex', oxidationIndex);
                    degreesOfOxidationNew = changeDegreeOfOxydatation(degreesOfOxidation, oxidationIndex);
                    addedOxydation = true;
                }
                else if (oldOxidationIndex != undefined) {
                    var sigments = degreesOfOxidation.closest('.ChemicalGenerator-desktop_chemicalProces').find('.ChemicalGenerator-desktop_chemicalProces-segment[data-oxidation][data-oxidationIndex="' + oldOxidationIndex + '"]');
                    if (sigments.length == 1 && oldOxidationIndex != oxidationIndex) { //2 remove one old oxidation + create degree
                        sTemp3.removeAttr("data-oxidationindex");
                        var degreeToRemove = prosses.find('.ChemicalGenerator-desktop_degreesOfOxidations .ChemicalGenerator-desktop_degreesOfOxidation[data-oxidationindex="' + oldOxidationIndex + '"]');
                        changeDegreeData(resizeExtra.find('.ChemicalGenerator-desktop_degreesOfOxidation-num'), degreeToRemove);
                        trashAnimate();
                        degreeToRemove.remove();
                        sTemp3.attr('data-oxidationindex', oxidationIndex);
                        degreesOfOxidationNew = changeDegreeOfOxydatation(degreesOfOxidation, oxidationIndex);
                        addedOxydation = true;
                    }
                    else if (sigments.length == 2) {
                        var extraSigment = degreesOfOxidation.closest('.ChemicalGenerator-desktop_chemicalProces').find('.ChemicalGenerator-desktop_chemicalProces-segment[data-oxidation][data-oxidationextraindex="' + oldOxidationIndex + '"]');
                        if (extraSigment.length == 0) { //3:to do create   extra degree of oxydation + don't remove
                            var degreesOfOxidationNew = prosses.find('.ChemicalGenerator-desktop_degreesOfOxidations .ChemicalGenerator-desktop_degreesOfOxidation[data-oxidationindex="' + oldOxidationIndex + '"]');
                            var cur_direction = degreesOfOxidation.find('.ChemicalGenerator-desktop_degreesOfOxidation_extra').attr('startsfrom') == 'left' ? 'right' : 'left';
                            var newExtra = createExtraOxidation(degreesOfOxidationNew, cur_direction);
                            degreesOfOxidationNew.find('.ChemicalGenerator-desktop_degreesOfOxidation-input input').setInputTextSize(true);
                            changeDegreeData(newExtra.find('.ChemicalGenerator-desktop_degreesOfOxidation-num'), degreesOfOxidation.children('.ChemicalGenerator-desktop_degreesOfOxidation-num'));

                            var sigment = degreesOfOxidation.closest('.ChemicalGenerator-desktop_chemicalProces').find('.ChemicalGenerator-desktop_chemicalProces-segment[data-oxidation][data-oxidationIndex="' + oxidationIndex + '"]').eq(0);
                            sigment.removeAttr("data-oxidationindex");
                            sigment.attr('data-oxidationextraindex', oldOxidationIndex);
                            addedOxydation = true;
                            degreesOfOxidation.remove();
                        }
                    }
                }
                if (!addedOxydation) {
                    //4: nothing can't be added
                    degreesOfOxidation.removeAttr("extra_oxidation");
                    degreesOfOxidation.find('.ChemicalGenerator-desktop_degreesOfOxidation_extra').remove();

                }
                sTemp3.removeAttr("data-oxidationTempextraIndex");
            }

            if (degreesOfOxidationNew != undefined) {
                setDegreesOfOxidationPosition(degreesOfOxidationNew, true);
            }
            chemicalGeneratorContainer.attr('data-resize', '');
            document.onmouseup = null;
            document.onmousemove = null;
        };

        document.onmouseup = onmouseup;
        document.onmousemove = onmousemove;

    }
    var resizeExtra = function (dom, e) {
        e = e || window.event;
        e.preventDefault();
        protectUp = true;

        var resizeExtra = dom;
        var resizeDom = dom.parents('.ChemicalGenerator-desktop_degreesOfOxidation').find('.ChemicalGenerator-desktop_degreesOfOxidation-resize');

        var prosses = resizeDom.closest('.ChemicalGenerator-desktop_chemicalProces');
        var degreesOfOxidation = resizeDom.closest('.ChemicalGenerator-desktop_degreesOfOxidation');
        if (!degreesOfOxidation.is('.ChemicalGenerator-desktop_degreesOfOxidation--can_resize')) {
            chemicalGeneratorContainer.find('.ChemicalGenerator-desktop_degreesOfOxidation--can_resize').removeClass('ChemicalGenerator-desktop_degreesOfOxidation--can_resize');
            degreesOfOxidation.addClass('ChemicalGenerator-desktop_degreesOfOxidation--can_resize');
        }

        var oxidationIndex = degreesOfOxidation.attr('data-oxidationIndex');
        var sigments = prosses.find('.ChemicalGenerator-desktop_chemicalProces-segment[data-oxidation][data-oxidationIndex="' + oxidationIndex + '"]');
        var extraSigment = prosses.find('.ChemicalGenerator-desktop_chemicalProces-segment[data-oxidation][data-oxidationextraindex="' + oxidationIndex + '"]');
        var s1 = null, s2 = null, s3 = null;
        var sTemp1 = null, sTemp2 = null, sTemp3 = null;
        if (sigments.length > 0) {
            s1 = sigments.eq(0);
            sTemp1 = s1;
        }
        if (sigments.length > 1) {
            s2 = sigments.eq(1);
            sTemp2 = s2;
        }

        if (s1 == null || s2 == null) {
            return;
        }

        var startsFrom = resizeExtra.attr('startsfrom');


        if (extraSigment.length > 0) {
            s3 = extraSigment.eq(0);
            extraSigment.removeAttr('data-oxidationextraindex');
            s3.removeAttr("data-oxidationextraindex");
            sTemp3 = s3;
            sTemp3.attr('data-oxidationTempextraIndex', oxidationIndex);
        }
        else {
            if (startsFrom == 'left') {
                s3 = s1;
                sTemp3 = s3;
                sTemp1.attr('data-oxidationTempextraIndex', oxidationIndex);
            }
            else {
                s3 = s2;
                sTemp3 = s3;
                sTemp2.attr('data-oxidationTempextraIndex', oxidationIndex);
            }
        }

        var allSegments = prosses.find('.ChemicalGenerator-desktop_chemicalProces-segment[data-oxidation]');
        allSegments = getSigmentPoditionData(allSegments);
        var resizeLeftP = s1.offset().left + (s1.width() / 2);
        var resizeLeftStartM = e.clientX;
        var resizeStartW = resizeExtra.width();
        var dW = 0;

        chemicalGeneratorContainer.attr('data-resize', 'e');

        var onmousemove = function (e1) {
            dW = resizeLeftStartM - e1.clientX;

            startsFrom = resizeExtra.attr('startsfrom');
            if (startsFrom == 'left') {
                var w = resizeStartW - dW;
            }
            else {
                var w = resizeStartW + dW;

            }

            if (w < 3 * fontSize) {

                var dw1 = resizeExtra.closest('.ChemicalGenerator-desktop_degreesOfOxidation').width();

                if (startsFrom == 'left' && dW > 0) {
                    resizeLeftStartM = e1.clientX + dw1 - resizeStartW;
                    resizeExtra.attr('startsfrom', 'right');
                    resizeExtra.closest('.ChemicalGenerator-desktop_degreesOfOxidation').attr('extra_oxidation', 'right');
                    w = resizeStartW + dw1;
                }
                else if (startsFrom == 'right' && dW < 0) {
                    resizeExtra.attr('startsfrom', 'left');
                    resizeExtra.closest('.ChemicalGenerator-desktop_degreesOfOxidation').attr('extra_oxidation', 'left');
                    resizeLeftStartM = e1.clientX + resizeStartW - dw1;
                    w = resizeStartW - dw1;
                }
            }
            var _sTemp3 = getClosestSigmentForExtra(resizeExtra.find('.ChemicalGenerator-desktop_degreesOfOxidation_extra_drag').offset().left, oxidationIndex, allSegments);
            if (_sTemp3 != null) {
                if (sTemp3 != null) {
                    sTemp3.removeAttr("data-oxidationTempextraIndex");
                }
                sTemp3 = _sTemp3;
                sTemp3.attr('data-oxidationTempextraIndex', oxidationIndex);
            }
            resizeExtra.width(w);
        };
        var onmouseup = function (e1) {
            if (sTemp3 != null) {
                var oldOxidationIndex = $(sTemp3[0]).attr('data-oxidationindex');
                var oldExtraOxidationIndex = $(sTemp3[0]).attr('data-oxidationextraindex');
                if (oldOxidationIndex == undefined && oldExtraOxidationIndex == undefined) {
                    sTemp3.attr('data-oxidationextraindex', oxidationIndex);
                }
                else if (oldOxidationIndex != undefined) { // remove one old oxidation
                    var sigments = degreesOfOxidation.closest('.ChemicalGenerator-desktop_chemicalProces').find('.ChemicalGenerator-desktop_chemicalProces-segment[data-oxidation][data-oxidationIndex="' + oldOxidationIndex + '"]');
                    if (sigments.length == 1) {
                        sTemp3.removeAttr("data-oxidationindex");
                        sTemp3.attr('data-oxidationextraindex', oxidationIndex);
                        var degreeToRemove = prosses.find('.ChemicalGenerator-desktop_degreesOfOxidations .ChemicalGenerator-desktop_degreesOfOxidation[data-oxidationindex="' + oldOxidationIndex + '"]');
                        changeDegreeData(resizeExtra.find('.ChemicalGenerator-desktop_degreesOfOxidation-num'), degreeToRemove);
                        trashAnimate();
                        degreeToRemove.remove();
                    }
                }
                sTemp3.removeAttr("data-oxidationTempextraIndex");
            }

            setDegreesOfOxidationPosition(degreesOfOxidation, true);

            chemicalGeneratorContainer.attr('data-resize', '');
            document.onmouseup = null;
            document.onmousemove = null;
        };

        document.onmouseup = onmouseup;
        document.onmousemove = onmousemove;

    }

    var initFractionEvents = function (segment) {
        var in1 = segment.find('input').eq(0);
        var in2 = segment.find('input').eq(1);
        in1.on('keydown', function (e) {
            if (e.which == 40) {
                in2.focus();
            }
        });
        in2.on('keydown', function (e) {
            if (e.which == 38) {
                in1.focus();
            }
        });
    }
    var copyDataFromExtraOxidationToMain = function (degreeOfOxidation) {
        var extra = degreeOfOxidation.find('.ChemicalGenerator-desktop_degreesOfOxidation_extra');
        var degreesInput = extra.find('.ChemicalGenerator-desktop_degreesOfOxidation-input input').val();

        var updateClass = degreeOfOxidation.find('.ChemicalGenerator-desktop_degreesOfOxidation-num--' + (degreeOfOxidation.attr('extra_oxidation') == 'left' ? 'right' : 'left'));


        var resizeDom = degreeOfOxidation.find('.ChemicalGenerator-desktop_degreesOfOxidation-resize');

        var resizeH = extra.height() / fontSize;
        resizeDom.height(resizeH + 'em');

        var oxidationindex = degreeOfOxidation.attr('data-oxidationindex');
        var oxidations = degreeOfOxidation.closest('.ChemicalGenerator-desktop_chemicalProces').find('.ChemicalGenerator-desktop_chemicalProces-segment[data-oxidationindex="' + oxidationindex + '"]');
        var oxidationExtra = degreeOfOxidation.closest('.ChemicalGenerator-desktop_chemicalProces').find('.ChemicalGenerator-desktop_chemicalProces-segment[data-oxidationextraindex="' + oxidationindex + '"]');
        if (oxidations.length == 2) {
            oxidationExtra.attr('data-oxidationindex', oxidationindex);
            oxidationExtra.removeAttr('data-oxidationextraindex');
            var anchorLeft = $(oxidations[0]);
            var anchorRight = $(oxidations[1]);
            if (oxidations[1].offsetLeft < oxidations[0].offsetLeft) {
                anchorLeft = $(oxidations[1]);
                anchorRight = $(oxidations[0]);
            }
            if (degreeOfOxidation.attr('extra_oxidation') == 'left') {
                anchorRight.removeAttr('data-oxidationindex');
            }
            else {
                anchorLeft.removeAttr('data-oxidationindex');
            }

        }
        else if (oxidations.length == 1) {  //deleted one element of oxidations !!!!
            if (($(oxidations[0]).offset().left < $(oxidationExtra[0]).offset().left && degreeOfOxidation.attr('extra_oxidation') == 'left')
                || ($(oxidations[0]).offset().left > $(oxidationExtra[0]).offset().left && degreeOfOxidation.attr('extra_oxidation') == 'right')) {
                oxidationExtra.attr('data-oxidationindex', oxidationindex);
                oxidationExtra.removeAttr('data-oxidationextraindex');
            }
        }
        setDegreesOfOxidationPosition(degreeOfOxidation, false);

        //var resizeW = extra.width() / fontSize;
        //resizeDom.width(resizeW + 'em');
        degreeOfOxidation.find('.ChemicalGenerator-desktop_degreesOfOxidation-input input').val(degreesInput);

        changeDegreeData(updateClass, extra);
    }
    function changeDegreeOfOxydatation(degreesOfOxidation, oxidationIndex) {
        var degreesOfOxidationNew = creatDegreesOfOxidation();
        //chemicalGeneratorContainer.find('.ChemicalGenerator-desktop_degreesOfOxidation--can_resize').removeClass('ChemicalGenerator-desktop_degreesOfOxidation--can_resize');
        //degreesOfOxidationNew.addClass('ChemicalGenerator-desktop_degreesOfOxidation--can_resize');

        var s1, s2;
        var sigments = degreesOfOxidation.closest('.ChemicalGenerator-desktop_chemicalProces').find('.ChemicalGenerator-desktop_chemicalProces-segment[data-oxidation][data-oxidationIndex="' + oxidationIndex + '"]');

        s1 = sigments.eq(0);
        s2 = sigments.eq(1);

        protectUp = true;
        var totals = degreesOfOxidation.closest('.ChemicalGenerator-desktop_chemicalProces').find('.ChemicalGenerator-desktop_degreesOfOxidations');

        var oxOffset = totals.offset();
        var leftP1 = (s1.offset().left - oxOffset.left + (s1.width() / 2)) / fontSize;
        var leftP2 = (s2.offset().left - oxOffset.left + (s2.width() / 2)) / fontSize;
        degreesOfOxidationNew.css('left', leftP1 + 'em');
        degreesOfOxidationNew.find('.ChemicalGenerator-desktop_degreesOfOxidation-resize').css('width', (leftP2 - leftP1) + 'em');
        degreesOfOxidationNew.attr('data-oxidationIndex', oxidationIndex);
        s1.attr('data-oxidationIndex', oxidationIndex);
        s2.attr('data-oxidationIndex', oxidationIndex);

        degreesOfOxidation.parent().append(degreesOfOxidationNew);

        var degreeToRemoveL;
        var degreeToRemoveR;
        if (degreesOfOxidation.attr('extra_oxidation') == 'left') {
            degreeToRemoveL = degreesOfOxidation.children('.ChemicalGenerator-desktop_degreesOfOxidation-num');
            degreeToRemoveR = degreesOfOxidation.children('.ChemicalGenerator-desktop_degreesOfOxidation_extra');
        }
        else {

            degreeToRemoveL = degreesOfOxidation.children('.ChemicalGenerator-desktop_degreesOfOxidation_extra');
            degreeToRemoveR = degreesOfOxidation.children('.ChemicalGenerator-desktop_degreesOfOxidation-num');
        }
        if (degreesOfOxidation.hasClass('ChemicalGenerator-desktop_degreesOfOxidation--bottom')) {
            degreesOfOxidationNew.addClass('ChemicalGenerator-desktop_degreesOfOxidation--bottom');
        }
        changeDegreeData(degreesOfOxidationNew.find('.ChemicalGenerator-desktop_degreesOfOxidation-num--left'), degreeToRemoveL);
        changeDegreeData(degreesOfOxidationNew.find('.ChemicalGenerator-desktop_degreesOfOxidation-num--right'), degreeToRemoveR);
        degreesOfOxidation.remove();
        degreesOfOxidationNew.find('.ChemicalGenerator-desktop_degreesOfOxidation-input input').setInputTextSize(true);
        return degreesOfOxidationNew;
    }
    function changeDegreeData(degreeToChange, degreeToRemove) {
        degreeToChange.find('.ChemicalGenerator-desktop_degreesOfOxidation-num-input input').val(degreeToRemove.find('.ChemicalGenerator-desktop_degreesOfOxidation-num-input input').val());
        degreeToChange.find('.ChemicalGenerator-desktop_degreesOfOxidation-num-input-left input').val(degreeToRemove.find('.ChemicalGenerator-desktop_degreesOfOxidation-num-input-left input').val());
        setDegreeEmptyStyle(degreeToChange);
    }
    function setDegreeEmptyStyle(degreeToChange) {
        var input_value = degreeToChange.find('.ChemicalGenerator-desktop_degreesOfOxidation-num-input input').val();
        if (input_value.trim() == '') {
            degreeToChange.addClass('ChemicalGenerator-desktop_degreesOfOxidation-num--0');
        }
        else {
            degreeToChange.removeClass('ChemicalGenerator-desktop_degreesOfOxidation-num--0');
        }
    }
    function appendSpecialKeyBoard(elem, symbol) {
        var div = '<div class="special_keyboard"><span>' + symbol + '</span></div>';
        div = $(div);
        div.on('click', function (e) {
            insertAtCursor(elem.find('input')[0], symbol);
            e.stopPropagation();
        });
        elem.append(div);
    }
    function insertAtCursor(myField, myValue) {
        var maxlengtherror = $(myField).attr('maxlength') < (myField.value.length + myValue.length);
        if ($(myField).attr('maxlength') > 0 && maxlengtherror) {
            return;
        }
        //IE support
        if (document.selection) {
            myField.focus();
            sel = document.selection.createRange();
            sel.text = myValue;
        }
        // Microsoft Edge
        else if (window.navigator.userAgent.indexOf("Edge") > -1) {
            var startPos = myField.selectionStart;
            var endPos = myField.selectionEnd;

            myField.value = myField.value.substring(0, startPos) + myValue
                + myField.value.substring(endPos, myField.value.length);

            var pos = startPos + myValue.length;
            myField.focus();
            myField.setSelectionRange(pos, pos);
        }
        //MOZILLA and others
        else if (myField.selectionStart || myField.selectionStart == '0') {
            var startPos = myField.selectionStart;
            var endPos = myField.selectionEnd;
            myField.value = myField.value.substring(0, startPos)
                + myValue
                + myField.value.substring(endPos, myField.value.length);
            var pos = startPos + myValue.length;
            myField.setSelectionRange(pos, pos);
        } else {
            myField.value += myValue;
        }
        myField.focus();
        $(myField).change();
    }
    // #endregion

    // #region initcalcTable
    function initcalcTable() {
        if (chemicalGeneratorContainer.find('.calcTableElement').length == 0) {
            var f;

            if ('calcTable' in state && 'process' in state.calcTable && state.calcTable.process.length>0) {
                f = displayProcess('calcTable', 0);
            }
            else {
               f = createChemicalProces('calcTable');
               f.css({
                    top: (2 * desktopGridItemSize) + 'em',
                    left: (2 * desktopGridItemSize) + 'em'
                }); 
            }
            //f.addClass('calcTableElement');
            var desktop_layer = chemicalGeneratorContainer.find('.ChemicalGenerator-desktop_layer-container');
            desktop_layer.find('.ChemicalGenerator-desktop_chemicalProces').map(function () {
                if ($(this).find('.ChemicalGenerator-desktop_chemicalProces-segment:not(.ChemicalGenerator-desktop_chemicalProces-segment--empty)').length == 0
                    && $(this).find('.ChemicalGenerator-desktop_SummaryLine').length == 0
                    && $(this).find('.ChemicalGenerator-desktop_Arrow').length == 0 && !$(this).is('#dH_box')
                ) {
                    $(this).remove();
                }
            });
            desktop_layer.append(f);
            f[0].set_intersection();
            f.find('.ChemicalGenerator-desktop_chemicalProces_toolbar').append('<div class= "ChemicalGenerator-desktop_chemicalProces_toolbar-setTableBtn"><span>' + cet.translations.setTableData+'</span></div >')
            setProcesLayerFade();
            var copyBtn = $('.calcTableElement').find('.ChemicalGenerator-desktop_chemicalProces_toolbar-copyBtn');
            if ($('.calcTableElement').find('.ChemicalGenerator-desktop_chemicalProces-fragment').length <= 1) {
                copyBtn.addClass('ChemicalGenerator-desktop_chemicalProces_toolbar-btn--disabled');
            }
            createTCalcTableFromPreset(f);
        }
       
        function createTCalcTableFromPreset(process) {
            process.find('.calcTableTbl').remove();
            var table = $('<div class="calcTableTbl"><div class="row_header"></div><div class="rows_container"></div></div>');
            process.append(table);
            var header = table.find('.row_header');
            var table_data = state.calcTable.process.length > 0 ? state.calcTable.process[0].table_data : undefined;
            if (table_data!=undefined && 'header' in table_data && table_data.header.length > 0) {
                
                header.prepend('<div class="col col_delete"></div>');
                if (table_data.col_border_index != undefined && table_data.col_border_index.length > 0) {
                    addBorder = table_data.col_border_index;
                }
                for (var i = 0; i < table_data.header.length; i++) {
                    var current_header = table_data.header[i];
                    var newdiv = $('<div class="col col_i-' + i + '"></div>');
                    header.append(newdiv);
                    if (addBorder.length > 0 && addBorder.indexOf(i) > -1) {
                        newdiv.addClass('col_border');
                    }
                    var newFragment = creatFragment('');
                    newFragment.addClass('ChemicalGenerator-desktop_chemicalProces-fragment--isFirst');
                    newdiv.append(newFragment);
                    newFragment.find('.ChemicalGenerator-desktop_chemicalProces-segment').eq(0).addClass('column_selector');
                    createProcessDataFromPreset(current_header, newFragment);
                }
                
                var col_combo1 = $('<div class="col col_combo"><span>' + cet.translations.units + '</span></div>');
                header.append(col_combo1);
                var col_combo2 = $('<div class="col col_combo"><span>' + cet.translations.size + '</span></div>');
                header.append(col_combo2);
                header.append('<div class="col col_drag"></div>');
                
                if (table_data.rows != undefined && table_data.rows.length > 0) {
                    for (var i = 0; i < table_data.rows.length; i++) {
                        var row_data = table_data.rows[i];
                        createNewTableRow(table);
                        var current_row = table.find('.row_i-' + i);
                        if (row_data.data != undefined && row_data.data.length>0) {
                            for (var j = 0; j < row_data.data.length; j++) {
                                var col_data = row_data.data[j];
                                var l_frag = current_row.find('.col_i-' + j + ' .ChemicalGenerator-desktop_chemicalProces-fragment.ChemicalGenerator-desktop_chemicalProces-fragment--isFirst');
                               
                                createProcessDataFromPreset(col_data, l_frag);
                                
                            }
                            if (row_data.combo1 != undefined) {
                                current_row.find('.col_combo1 select').val(row_data.combo1);
                            }
                            if (row_data.combo2 != undefined) {
                                current_row.find('.col_combo2 select').val(row_data.combo2);
                            }

                        }
                    }
                }
                var empty_rows = table.find('.row_empty');
                if (empty_rows.length>1) {
                    empty_rows.eq(empty_rows.length-1).remove();
                }
                var rows_container = table.find('.rows_container');
                rows_container.sortable({ handle: ".col_drag" });
                setTableWidthScrollbar(table)

            }

        }
    }
    var addBorder =[];
    function setTableWidthScrollbar(table) {
        if (table.find('.rows_container').hasScrollBar()) {
            table.attr('y_scrollbar', 'true');
        }
        else {
            table.attr('y_scrollbar', 'false');
        }
    }
    function createNewTableRow(table, row_data, newData) {
        var rowCount = table.find('.row').length;
        var colCount = table.find('.row_header .col').length;
        var rowN = $('<div class="row row_i-' + rowCount + '"></div>');
        table.find('.rows_container').append(rowN);
        if (colCount > 0) {
            var c1;
            var c2
            if (row_data != undefined) {
                c1 = $(row_data).attr('col_combo1');
                c2 = $(row_data).attr('col_combo2');
            }
            var delete_col = $('<div class="col col_delete" delete_r_index="' + rowCount + '"></div>');
            rowN.append(delete_col);
            for (var i = 0; i < colCount - 4; i++) {
                newdiv = $('<div class="col col_i-' + i + '"></div>');
                rowN.append(newdiv);
                if (addBorder.length > 0 && addBorder.indexOf(i) > -1) {
                    newdiv.addClass('col_border');
                }
                if (row_data != undefined && rowCount > -1 && newData != undefined && newData[i] !== "") {
                    newdiv.html(row_data.find('.col.col_i-' + newData[i]).html());
                }
                else {
                    var newFragment = creatFragment('');
                    newFragment.addClass('ChemicalGenerator-desktop_chemicalProces-fragment--isFirst');
                    newdiv.append(newFragment);
                    newFragment.find('.ChemicalGenerator-desktop_chemicalProces-segment').eq(0).addClass('column_selector');
                }
            }
            var col_combo1 = $('<div class="col col_combo col_combo1" combo_r_index="' + rowCount + '"></div>');
            rowN.append(col_combo1);
            if (state.calcTable.combo1 != undefined) {
                var comb = CreateCombo(state.calcTable.combo1, c1);
                col_combo1.append(comb);
            }
            var col_combo2 = $('<div class="col col_combo col_combo2" combo_r_index="' + rowCount + '"></div>');
            if (state.calcTable.combo2 != undefined) {
                var comb2 = CreateCombo(state.calcTable.combo2, c2);
                col_combo2.append(comb2);
            }
            rowN.append(col_combo2);

            var drag_col = $('<div class="col col_drag" drag_r_index="' + rowCount + '"></div>');
            rowN.append(drag_col);
            if (rowN.find('.ChemicalGenerator-desktop_chemicalProces-fragment:not(.ChemicalGenerator-desktop_chemicalProces-fragment--isFirst)').length == 0) {
                rowN.addClass('row_empty');
            }
            setTableWidthScrollbar(table);
        }
    }
    function CreateCombo(combo, selectedItem) {
        if (combo != undefined) {
            var textDirection = (combo.direction != undefined && combo.direction == 'left') ? 'combo_left' : '';
            var comb = '<select class="minimal ' + textDirection + '">';
            var options = combo.options;
            for (var i = 0; i < options.length; i++) {
                if (selectedItem !== undefined && options[i] == selectedItem) {
                    comb = comb + '<option selected>' + options[i] + '</option>';
                }
                else {

                    comb = comb + '<option>' + options[i] + '</option>';
                }
            }
            comb = comb + '</select>';
            comb = $(comb);
            if (selectedItem != undefined) {
                $(comb).val(selectedItem);
            }
            return comb;
        }
    } 
     // #endregion
    // #region HessLaw
    function CreateLinePlace(top, left, tab, width) {

        var LineWrapper = $('<div class="ChemicalGenerator-desktop_chemicalProces can_trash dragLine LineWrapper ' + tab + 'Element" style="left: ' + left + 'em; top: ' + (top + 8) + 'em; background: rgba(0,0,0,0);">' +
            '<div class="ChemicalGenerator-desktop_chemicalProces_toolbar">' +
            '<div class="ChemicalGenerator-desktop_chemicalProces_toolbar-deleteBtn"></div></div></div>');

        var lineWidth = width == 0 ? '' : 'style = "width: ' + width + 'em;"';

        var Line = $('<div class="ChemicalGenerator-desktop_SummaryLine" ' + lineWidth + '></div>');
        LineWrapper.append(Line);
        return LineWrapper;
    }

    function displayLine(tab, i) {
        if (tab == 'HessLaw')
            var p = state.HessLaw.lines[i];
        else if (tab == 'EnergyGraph')
            var p = state.EnergyGraph.lines[i];
        var top = 0, left = 0, width = 0;
        if ('top' in p) {
            top = p.top;
        }
        if ('left' in p) {
            left = p.left;
        }
        if ('width' in p) {
            width = p.width;
        }
        if (tab == 'HessLaw')
            var line = CreateLinePlace(top - 8, left,'HessLaw', width);
        else if (tab == 'EnergyGraph')
            var line = CreateLinePlace(top - 8, left, 'EnergyGraph', width);

        let desktop_layer = chemicalGeneratorContainer.find('.ChemicalGenerator-desktop_layer-container');
        desktop_layer.append(line);
    }

    function RemoveEmptyFormulas() {

        let formulas = $('.ChemicalGenerator-desktop_chemicalProces:not(.calcTableElement):has(.ChemicalGenerator-desktop_chemicalProces-fragment)')

        for (let i = 0; i < formulas.length; i++) {
            if (formulas[i].innerText == "") {
                formulas[i] = $(formulas[i]);
                formulas[i].remove();
            }
        }
    }

    function initHessLaw() {

        if (state.HessLaw.process) {
            for (var i = 0; i < state.HessLaw.process.length; i++) {
                var p = displayProcess('HessLaw', i);
                let desktop_layer = chemicalGeneratorContainer.find('.ChemicalGenerator-desktop_layer-container');
                desktop_layer.append(p);
                p[0].set_intersection();
                setProcessDraggable(p);
                p.find('input.dH_data').change();
            }
        }

        if (state.HessLaw.lines) {
            for (var i = 0; i < state.HessLaw.lines.length; i++) {
                displayLine('HessLaw', i);
            }
        }

        // #region Summary Line



        chemicalGeneratorContainer.on('click', '#keyboard_dashed_btn', function () {
            // show the summary line below the lowest formula
            let lowestFormula = LocateLowestFormula();
            let lowestFormulaValues = lowestFormula.split(',');
            let SummaryLine = CreateLinePlace(parseFloat(lowestFormulaValues[0]), parseFloat(lowestFormulaValues[1]), selectedTab, 0);
            let desktop_layer = chemicalGeneratorContainer.find('.ChemicalGenerator-desktop_layer-container');
            desktop_layer.find('.ChemicalGenerator-desktop_chemicalProces--selected').removeClass('ChemicalGenerator-desktop_chemicalProces--selected')
            SummaryLine.addClass('ChemicalGenerator-desktop_chemicalProces--selected');
            desktop_layer.append(SummaryLine);
            RemoveEmptyFormulas();
            chemicalGeneratorContainer.find('.ChemicalGenerator-desktop_keyboard').hide();
        });

        chemicalGeneratorContainer.on('click', '.LineWrapper', function () {
            $(this).addClass('ChemicalGenerator-desktop_chemicalProces--selected');
            chemicalGeneratorContainer.find('.ChemicalGenerator-desktop_keyboard').hide();
        });

        chemicalGeneratorContainer.on('mouseover', '.dragLine', function () {
            // drag the summary line
            $(".dragLine").draggable({ containment: ".ChemicalGenerator-desktop" });
        });

        chemicalGeneratorContainer.on('click', '.ChemicalGenerator-desktop_SummaryLine', function () {

            if ($(this).find('.ChemicalGenerator-desktop_Resize_Circle-Right').length == 0) {

                var circle = $('<div class="ChemicalGenerator-desktop_Resize_Circle-Right"></div>');

                $(this).append(circle);
            }
            else {
                $(this).find('.ChemicalGenerator-desktop_Resize_Circle-Right').remove();
                $(".ChemicalGenerator-desktop_SummaryLine").resizable('destroy');
            }

        });

        chemicalGeneratorContainer.on('mouseover', '.ChemicalGenerator-desktop_Resize_Circle-Right', function () {
            // enable to strech the summary line to the right
            $(".ChemicalGenerator-desktop_SummaryLine").resizable({
                handles: "e",
                // cancel the parent div width to enable resizing
                resize: function (e, ui) {
                    ui.element.parent().width('');
                }
            });
        });

        function LocateLowestFormula() {
            // Find all the formulas and retrieve the location of the lowest one + remove all empty formulas
            let formulas = $('.ChemicalGenerator-desktop_chemicalProces:has(.ChemicalGenerator-desktop_chemicalProces-fragment).' + selectedTab + 'Element');
            let LocationTop = 0;
            let LocationLeft = 20;
            //let location = new Location(0, 20)
            let notEmptyFormulas = [];

            for (let i = 0; i < formulas.length; i++) {
                if (formulas[i].innerText != "") {
                    notEmptyFormulas.push(formulas[i]);
                }
            }

            for (let i = 0; i < notEmptyFormulas.length; i++) {
                if (parseFloat(notEmptyFormulas[i].style['top']) > LocationTop) {
                    LocationTop = parseFloat(notEmptyFormulas[i].style['top']);
                    LocationLeft = parseFloat(notEmptyFormulas[i].style['left']);
                }
            }
            if (LocationTop == 0) {
                LocationTop = 20;
            }
            //Concating the values to a string to support IE
            return LocationTop.toString() + ',' + LocationLeft.toString();
        }

        // #endregion

        // #region Delete molecule parts

        chemicalGeneratorContainer.on('click', '#keyboard_data_delete_btn', function () {
            if (deleteStatus == false) {
                $('.ChemicalGenerator-desktop_chemicalProces-segment').addClass('ChemicalGenerator-desktop_Delete');
            }
            else {
                $('.ChemicalGenerator-desktop_chemicalProces-segment').removeClass('ChemicalGenerator-desktop_Delete');
            }
            RemoveEmptyFormulas();
            deleteStatus = !deleteStatus;

        });

        chemicalGeneratorContainer.on('mousedown', '.ChemicalGenerator_Molecule', function () {
            $(this).children().unwrap();
        });

        chemicalGeneratorContainer.on('mouseleave', '.ChemicalGenerator-MoleculePart', function () {
            $('.ChemicalGenerator-MoleculePart').removeClass('ChemicalGenerator-MoleculePart');
        });

        chemicalGeneratorContainer.on('mousedown', '.ChemicalGenerator-MoleculePart', function () {
            $('.ChemicalGenerator-MoleculePart').wrapAll("<div class='ChemicalGenerator_Molecule' />");
            $('.ChemicalGenerator-MoleculePart').removeClass('ChemicalGenerator-MoleculePart');
        });

        chemicalGeneratorContainer.on('mouseover', '.ChemicalGenerator-desktop_chemicalProces-segment:not(.ChemicalGenerator-desktop_chemicalProces-segment--empty)', function () {
            if (selectedTab == "HessLaw" && deleteStatus == true) {
                var currentFregment = $(this).parent().parent();


                // We perform the deletion functionality only on deleteable items
                // 
                // Not isFirst fragments
                // Not isStart fragments (except fractions)
                // Not already deleted Molecules

                if (chemicalGeneratorContainer.find('.ChemicalGenerator-MoleculePart').length == 0 &&
                    (!currentFregment.is('.ChemicalGenerator-desktop_chemicalProces-fragment--isStart') &&
                        !currentFregment.is('.ChemicalGenerator-desktop_chemicalProces-fragment--isFirst') &&
                        !currentFregment.parent().is('.ChemicalGenerator_Molecule')) ||
                    currentFregment[0].innerText == 'fraction') {

                    // We need to delete the mekadem and the atoms of the mulecule separately
                    // So, we find what was the location of the click
                    // If it was on the mekadem part we go backwords and forwards to locate all the parts of the mekadem
                    // and the same if an atom was clicked

                    let mekadem = [];
                    let substances = [];

                    var Before = currentFregment.prevUntil('.ChemicalGenerator-desktop_chemicalProces-fragment--isStart,.ChemicalGenerator-desktop_chemicalProces-fragment--isFirst').get();
                    var After = currentFregment.nextUntil('.ChemicalGenerator-desktop_chemicalProces-fragment--isStart, :not(.ChemicalGenerator-desktop_chemicalProces-fragment)').get();

                    if (IsMekadem(currentFregment[0])) {
                        // A mekadem part was clicked
                        mekadem.push(currentFregment[0]);
                        for (i = 0; i < Before.length; i++) {
                            if (IsMekadem(Before[i]))
                                mekadem.push(Before[i]);
                            else { break; }
                        }
                        for (i = 0; i < After.length; i++) {
                            if (IsMekadem(After[i]))
                                mekadem.push(After[i]);
                            else { break; }
                        }
                    }
                    else {
                        // A substance (atom) was clicked
                        substances.push(currentFregment[0]);
                        for (i = 0; i < Before.length; i++) {
                            if (!IsMekadem(Before[i]))
                                substances.push(Before[i]);
                            else { break; }
                        }
                        for (i = 0; i < After.length; i++) {
                            if (!IsMekadem(After[i]))
                                substances.push(After[i]);
                            else { break; }
                        }
                    }

                    for (i = 0; i < mekadem.length; i++) {
                        mekadem[i] = $(mekadem[i]);
                        mekadem[i].addClass('ChemicalGenerator-MoleculePart')
                    }
                    for (i = 0; i < substances.length; i++) {
                        substances[i] = $(substances[i]);
                        substances[i].addClass('ChemicalGenerator-MoleculePart')
                    }
                }
            }
        });

        function IsMekadem(Fragment) {
            // Find if the value of the fregment is part of the 'mekadem' or part of the 'substances' of the mulecule
            // A 'Mekadem' is :
            // Numeric or decimal point of a regular fregment (not fragment2)
            // A fraction

            Fragment = $(Fragment);

            if ((!Fragment.is('.ChemicalGenerator-desktop_chemicalProces-fragment2') && (Fragment[0].innerText >= '0' && Fragment[0].innerText <= '9') || Fragment[0].innerText == '.')
                || Fragment[0].innerText == 'fraction')
                return true;
            else
                return false;
        }

        // #endregion        
    }
    // #endregion

    // #region EnergyGraph

    function adjustUnderLine() {

        let desktop_layer = chemicalGeneratorContainer.find('.ChemicalGenerator-desktop_layer-container');
        let currentFormula = desktop_layer.find('.ChemicalGenerator-desktop_chemicalProces--selected:not(.LineWrapper):not(.ArrowWrapper)');

        // Add a line only if this formula does not already have one
        if (currentFormula.length > 0 && !currentFormula.next().is('.LineWrapper')) {
            let formula = $('.ChemicalGenerator-desktop_chemicalProces--selected');
            let SummaryLine = CreateLinePlace(parseFloat(formula[0].style['top']), parseFloat(formula[0].style['left']), 'EnergyGraph',0);
            SummaryLine.width($('.ChemicalGenerator-desktop_chemicalProces--selected').width());
            SummaryLine.find('.ChemicalGenerator-desktop_SummaryLine').width($('.ChemicalGenerator-desktop_chemicalProces--selected').width());
            desktop_layer.append(SummaryLine);
        }
        else {
            currentFormula.next().width(currentFormula.width());
            currentFormula.next().find('.ChemicalGenerator-desktop_SummaryLine').width(currentFormula.width());
        }
        if (currentFormula.length > 0 && currentFormula[0].innerText == '') {
            currentFormula.next('.LineWrapper ').remove(); 
        }
    }

    function CreateArrow(top, left, height, color, direction) {

        var ArrowWrapper = $('<div class="ChemicalGenerator-desktop_chemicalProces can_trash  dragArrow ChemicalGenerator-desktop_chemicalProces--selected ArrowWrapper EnergyGraphElement" style="padding: 0em 1em; left: ' + left + 'em; top: ' + top + 'em; background: rgba(0,0,0,0);">' +
            '<div class="ChemicalGenerator-desktop_chemicalProces_toolbar">' +
            '<div class="ChemicalGenerator-desktop_chemicalProces_toolbar-turquoiseBtn"></div>\
                                  <div class="ChemicalGenerator-desktop_chemicalProces_toolbar-orangeBtn"></div>\
                                  <div class="ChemicalGenerator-desktop_chemicalProces_toolbar-greyBtn"></div>\
                                  <div class="ChemicalGenerator-desktop_chemicalProces_toolbar-rotateBtn"></div>\
                                  <div class="ChemicalGenerator-desktop_chemicalProces_toolbar-deleteBtn"></div></div></div>');

        var arrowHeight = height == 0 ? '' : 'style = "height: ' + height + 'em;"';

        var arrowClass = 'ChemicalGenerator-desktop_Arrow-' + color + direction;

        var Arrow = $('<div class="ChemicalGenerator-desktop_Arrow ' + arrowClass + '" ' + arrowHeight + '></div>');

        ArrowWrapper.append(Arrow);

        var box = $('<div id="dH_box" class="ChemicalGenerator-desktop_chemicalProces ChemicalGenerator-desktop_chemicalProces--selected ChemicalGenerator-desktop_dH_box"></div>');

        var dH = $('<div class="ChemicalGenerator-desktop_chemicalProces_dH">' +
            '<div class="dH-container">' +
            '<div>ΔH </div>' +
            '</div>' +
            '<input class="dH_index" type="text" maxlength="1">' +
            '<div>' +
            '<div>=</div>' +
            '</div>' +
            '<input class="dH_data" type="text" maxlength="9">' +
            '</div>)');

        box.append(dH);
        box.find('.dH_data').setInputTextSize(true);
        ArrowWrapper.append(box);

        return ArrowWrapper;
    }

    function displayArrow(i) {

        var p = state.EnergyGraph.arrows[i];
        var top = 0, left = 0, height = 0, color = 'grey', direction='Up';
        if ('top' in p) {
            top = p.top;
        }
        if ('left' in p) {
            left = p.left;
        }
        if ('height' in p) {
            height = p.height;
        }
        if ('color' in p) {
            color = p.color;
        }
        if ('direction' in p) {
            direction = p.direction;
        }
        var arrow = CreateArrow(top, left, height, color, direction);

        if (p.dH && p.dH.visible == true) {
            var dh = arrow.find('.ChemicalGenerator-desktop_dH_box');
            dh.removeClass().addClass('ChemicalGenerator-desktop_chemicalProces').addClass('ChemicalGenerator-desktop_dH_box-dH');
            arrow.attr('dH_shown', 'true');
            dh.find('.dH_index').attr('value', p.dH.dh_initial_index);
            dh.find('.dH_data').attr('value', p.dH.dh_initial_data);
        }

        let desktop_layer = chemicalGeneratorContainer.find('.ChemicalGenerator-desktop_layer-container');
        desktop_layer.append(arrow);
        initialRatio = arrow.height() / ARROW_HEIGHT;
        arrowUp = true;
    }

    function initEnergyGraph() {

        let arrowUp = true;

        var initialRatio; // The initial ratio between the arrow length and the bottom circle location
        

        if (state.EnergyGraph.process) {
            for (var i = 0; i < state.EnergyGraph.process.length; i++) {
                var p = displayProcess('EnergyGraph', i);
                let desktop_layer = chemicalGeneratorContainer.find('.ChemicalGenerator-desktop_layer-container');
                desktop_layer.append(p);
                p[0].set_intersection();
                setProcessDraggable(p);
                p.find('input.dH_data').change();
            }
        }


        if (state.EnergyGraph.lines) {
            for (var i = 0; i < state.EnergyGraph.lines.length; i++) {
                displayLine('EnergyGraph', i);
            }
        }

        if (state.EnergyGraph.arrows) {
            for (var i = 0; i < state.EnergyGraph.arrows.length; i++) {
                displayArrow(i);
            }
        }

        chemicalGeneratorContainer.on('click', '#keyboard_up_arrow_btn', function () {

            let selectedProcess = $('.ChemicalGenerator-desktop_chemicalProces--selected')

            let Arrow = CreateArrow(parseFloat(selectedProcess[0].style['top']), parseFloat(selectedProcess[0].style['left']),0, 'grey','Up');

            let desktop_layer = chemicalGeneratorContainer.find('.ChemicalGenerator-desktop_layer-container');
            desktop_layer.append(Arrow);
            initialRatio = Arrow.height() / ARROW_HEIGHT;
            RemoveEmptyFormulas();
            chemicalGeneratorContainer.find('.ChemicalGenerator-desktop_keyboard').hide();
            arrowUp = true;
        });

        chemicalGeneratorContainer.on('click', '.ArrowWrapper', function (e) {
            if (!$(this).is('.ChemicalGenerator-desktop_chemicalProces--selected')) {
                $(this).addClass('ChemicalGenerator-desktop_chemicalProces--selected');
            }
            if (e.target.id != "dH_box") {
                chemicalGeneratorContainer.find('.ChemicalGenerator-desktop_keyboard').hide();
            }
        });

        chemicalGeneratorContainer.on('mouseover', '.dragArrow', function () {
            // drag the arrow
            $(".dragArrow").draggable({ containment: ".ChemicalGenerator-desktop" });
        });

        chemicalGeneratorContainer.on('click', '.ChemicalGenerator-desktop_Arrow', function () {

            if ($(this).find('[class^="ChemicalGenerator-desktop_Resize_Circle"]').length == 0) {

                chemicalGeneratorContainer.find('[class^="ChemicalGenerator-desktop_Resize_Circle"]').remove();

                if ($(this).is('[class$="Up"]')) {
                    var circle = $('<div class="ChemicalGenerator-desktop_Resize_Circle-Up"></div>');
                }
                else if ($(this).is('[class$="Down"]')) {
                    var circle = $('<div class="ChemicalGenerator-desktop_Resize_Circle-Down"></div>');
                    circle[0].style['top'] = $(this).height() / initialRatio + 'em';

                }

                $(this).append(circle);
            }
            else {
                chemicalGeneratorContainer.find('[class^="ChemicalGenerator-desktop_Resize_Circle"]').remove();

                //$(this).find('[class^="ChemicalGenerator-desktop_Resize_Circle"]').remove();
                $(".ChemicalGenerator-desktop_chemicalProces--selected").resizable('destroy');
            }
        });

        chemicalGeneratorContainer.on('mouseover', '.ChemicalGenerator-desktop_Resize_Circle-Up', function () {

            // The mimimum length will be of the 5 toolbar buttons + half button size for the spaces
            var initialHeight = $('.ChemicalGenerator-desktop_chemicalProces_toolbar-deleteBtn').height() * 5.5;

            // enable to strech the arrow up            
            $(".ChemicalGenerator-desktop_chemicalProces--selected").resizable({
                handles: "n",
                minHeight: initialHeight,
                resize: function (e, ui) {
                    var arrow = ui.element.find('.ChemicalGenerator-desktop_Arrow');
                    arrow.height($(this).height());
                }
            });
        });

        chemicalGeneratorContainer.on('mouseover', '.ChemicalGenerator-desktop_Resize_Circle-Down', function () {

            // The mimimum length will be of the 5 toolbar buttons + half button size for the spaces
            var initialHeight = $('.ChemicalGenerator-desktop_chemicalProces_toolbar-deleteBtn').height() * 5.5;

            // enable to strech the arrow down
            $(".ChemicalGenerator-desktop_chemicalProces--selected").resizable({
                handles: "s",
                minHeight: initialHeight,
                resize: function (e, ui) {
                    var arrow = ui.element.find('.ChemicalGenerator-desktop_Arrow');
                    arrow.height($(this).height());
                    var circle = $('.ChemicalGenerator-desktop_Resize_Circle-Down');
                    circle[0].style['top'] = $(this).height() / initialRatio + 'em';
                }
            });
        });

        chemicalGeneratorContainer.on('click', '.ChemicalGenerator-desktop_chemicalProces_toolbar-orangeBtn', function (e) {
            let arrow = $(e.target).parent().next();
            arrow.removeClass().addClass('ChemicalGenerator-desktop_Arrow');
            if (arrowUp)
                arrow.addClass('ChemicalGenerator-desktop_Arrow-orangeUp');
            else
                arrow.addClass('ChemicalGenerator-desktop_Arrow-orangeDown');
        });

        chemicalGeneratorContainer.on('click', '.ChemicalGenerator-desktop_chemicalProces_toolbar-turquoiseBtn', function (e) {
            let arrow = $(e.target).parent().next();
            arrow.removeClass().addClass('ChemicalGenerator-desktop_Arrow');
            if (arrowUp)
                arrow.addClass('ChemicalGenerator-desktop_Arrow-turquoiseUp');
            else
                arrow.addClass('ChemicalGenerator-desktop_Arrow-turquoiseDown');
        });

        chemicalGeneratorContainer.on('click', '.ChemicalGenerator-desktop_chemicalProces_toolbar-greyBtn', function (e) {
            let arrow = $(e.target).parent().next();
            arrow.removeClass().addClass('ChemicalGenerator-desktop_Arrow');
            if (arrowUp)
                arrow.addClass('ChemicalGenerator-desktop_Arrow-greyUp');
            else
                arrow.addClass('ChemicalGenerator-desktop_Arrow-greyDown');
        });

        chemicalGeneratorContainer.on('click', '.ChemicalGenerator-desktop_chemicalProces_toolbar-rotateBtn', function (e) {

            let arrow = $(e.target).parent().next();
            let directionClass;

            // if the arrow is already resizable (to the other side) we cancel its resize functionality
            if (arrow.parent().find('.ui-resizable-handle').length > 0) {
                $(".ChemicalGenerator-desktop_chemicalProces--selected").resizable('destroy');
            }

            let circle = arrow.find('[class^="ChemicalGenerator-desktop_Resize_Circle"]');

            // if arrow faces up ==> contains a css that ends with 'up' - switch it to face down
            if (arrow.is('[class$="Up"]')) {
                directionClass = arrow.attr('class').split(' ').pop();
                directionClass = directionClass.replace("Up", "Down");
                if (circle[0]) {
                    circle.removeClass().addClass('ChemicalGenerator-desktop_Resize_Circle-Down');
                    circle[0].style['top'] = arrow.height() / initialRatio + 'em';
                }
            }
            // if arrow faces down ==> contains a css that ends with 'down' - switch it to face up
            else if (arrow.is('[class$="Down"]')) {
                directionClass = arrow.attr('class').split(' ').pop();
                directionClass = directionClass.replace("Down", "Up");
                if (circle[0]) {
                    circle.removeClass().addClass('ChemicalGenerator-desktop_Resize_Circle-Up');
                    circle[0].style['top'] = '-0.55em';
                }
            }


            arrow.removeClass().addClass('ChemicalGenerator-desktop_Arrow').addClass(directionClass);

            arrowUp = !arrowUp;

        });

    }

    // #endregion

    var onAppResize = function () {
        var cW = AppPriset.width,
            cH = AppPriset.height,
            vW = $('.app-content').width(),
            vH = $('.app-content').height(),
            newFontSize,
            marginTop = 0;

        if ((vW / vH) > (cW / cH)) {
            newFontSize = logecFontSize * (vH / cH);
        }
        else {
            newFontSize = logecFontSize * (vW / cW);
            marginTop = (vH - ((cH * newFontSize) / logecFontSize)) / 2;
        }

        fontSize = newFontSize;
        chemicalGeneratorContainer.css({
            'font-size': fontSize + 'px',
            'margin-top': marginTop + 'px'
        });
        Number(fontSize).toFixed(3);
        //fontSize = Number($('.ChemicalGeneratorContainer').css('font-size').replace('px', ''));

        var mi = chemicalGeneratorContainer.find('.ChemicalGenerator-tools .ChemicalGenerator-tools-tabs .ChemicalGenerator-tools-tab[data-tab-id="representationFormulas"] .ChemicalGenerator-tools-tab-representationFormulas_menu .ChemicalGenerator-desktop_representationFormula-menu_item');
        mi.attr('firstrun', '1');
        mi.draggable('option', 'cursorAt', {
            left: 0,
            top: 0
        });

        if (typeof (isFirst) == 'undefined') {
            chemicalGeneratorContainer.find('.ChemicalGenerator-desktop_layer-container .ChemicalGenerator-desktop_chemicalProces .ChemicalGenerator-desktop_degreesOfOxidations .ChemicalGenerator-desktop_degreesOfOxidation').map(function () {
                setDegreesOfOxidationPosition($(this), false);
            });
        }
    };
    var registerEvents = function () {
        window.addEventListener("resize", onAppResize);
        //$(document).mouseleave(function () {
        //    if ($(document).find('.ui-draggable-dragging').length > 0) {// || $(document).find('.ChemicalGenerator-desktop_degreesOfOxidation--can_resize').length > 0) {
        //        $(document).trigger('mouseup');
        //    }
        //});

        chemicalGeneratorContainer.find('.btn--masseg_close').on('click', function () {
            chemicalGeneratorContainer.find('.ChemicalGenerator-startover_masseg').hide('fade', {}, 500);
        });

        chemicalGeneratorContainer.find('.ChemicalGenerator-startover_masseg-btn--ok').on('click', function () {
            unSelectProcess();
            switch (selectedTab) {               
                case 'HessLaw':
                    chemicalGeneratorContainer.find('.HessLawElement').remove();
                    if (state.HessLaw.process) {
                        for (var i = 0; i < state.HessLaw.process.length; i++) {
                            var p = displayProcess('HessLaw', i);
                            let desktop_layer = chemicalGeneratorContainer.find('.ChemicalGenerator-desktop_layer-container');
                            desktop_layer.append(p);
                            p[0].set_intersection();
                            setProcessDraggable(p);
                            p.find('input.dH_data').change();
                        }
                    }
                    if (state.HessLaw.lines) {
                        for (var i = 0; i < state.HessLaw.lines.length; i++) {
                            displayLine('HessLaw', i);
                        }
                    }
                    break;
                case 'EnergyGraph':
                    chemicalGeneratorContainer.find('.EnergyGraphElement').remove();
                    if (state.EnergyGraph.process) {
                        for (var i = 0; i < state.EnergyGraph.process.length; i++) {
                            var p = displayProcess('EnergyGraph', i);
                            let desktop_layer = chemicalGeneratorContainer.find('.ChemicalGenerator-desktop_layer-container');
                            desktop_layer.append(p);
                            p[0].set_intersection();
                            setProcessDraggable(p);
                            p.find('input.dH_data').change();
                        }
                    }
                    if (state.EnergyGraph.lines) {
                        for (var i = 0; i < state.EnergyGraph.lines.length; i++) {
                            displayLine('EnergyGraph', i);
                        }
                    }
                    if (state.EnergyGraph.arrows) {
                        for (var i = 0; i < state.EnergyGraph.arrows.length; i++) {
                            displayArrow(i);
                        }
                    }
                    break;
                case 'calcTable':
                    chemicalGeneratorContainer.find('.calcTableElement').remove();
                    state.calcTable = AppPriset.calcTable;
                    initcalcTable();
                    break;
                case 'chemicalProcess':
                case 'degreesOfOxidation':
                case 'degreeOfOxidation':
                    chemicalGeneratorContainer.find('.chemicalProcessElement').remove();
                    state.chemicalProcess = JSON.parse(JSON.stringify(AppPriset.chemicalProcess));
                    state.degreesOfOxidation = JSON.parse(JSON.stringify(AppPriset.degreesOfOxidation));
                    oxidationIndex = 0;
                    if ('chemicalProcess' in state && 'process' in state.chemicalProcess) {
                        for (var i = 0; i < state.chemicalProcess.process.length; i++) {
                            var process = displayProcess('chemicalProcess', i);
                            chemicalGeneratorContainer.find('.ChemicalGenerator-desktop_layer-container').eq(0).append(process);
                            $('.dH_data').change();
                            setProcessDraggable(process);
                            var degreesOfOxidations = process.find('.ChemicalGenerator-desktop_degreesOfOxidations .ChemicalGenerator-desktop_degreesOfOxidation');
                            for (var j = 0; j < degreesOfOxidations.length; j++) {
                                setDegreesOfOxidationPosition(degreesOfOxidations.eq(j), false);
                            }
                        }
                        for (var i = 0; i < initOxidationDataTemp.length; i++) {
                            var currentOxidation = initOxidationDataTemp[i];
                            if (initOxidationDataTemp[i].extraoxidation) {
                                addExtraOxidation(currentOxidation);
                            }
                            currentOxidation.oxidation.children('.ChemicalGenerator-desktop_degreesOfOxidation-input').find('input').setInputTextSize(true);
                        }
                        initOxidationDataTemp = [];
                        options.container.animate(
                            {
                                opacity: 1
                            },
                            500
                        );
                    }
            }
            
        });
    };
    //#region iTestAssetController

    var saveState = function () {
        if (is_enable) {
            var _state = listenToCreateState();
            if (state.debugMode != 'undefined' && state.debugMode == 1) {
                localStorage.setItem('chemicalAsse', _state);
            }
            else {
                iTestAssetController.saveAnswerData(_state);
                defultState = _state;
            }

        }
        iTestAssetController.setDirtyMode(false);
    };
    var listenToCreateState = function () {
        var _state = app.createPreset();
        if (defultState != 'undefined' && (_state == defultState || _state==JSON.stringify(defultState))) {
            iTestAssetController.setDirtyMode(false);
        }
        else {
            iTestAssetController.setDirtyMode(true);
        }
        //todo
        return _state;
    };
    var listenToIsDirty = function () {
        var _state = app.createPreset();
        if (defultState != 'undefined' && (_state == defultState || _state==JSON.stringify(defultState))) {
            iTestAssetController.setDirtyMode(false);
        }
        else {
            iTestAssetController.setDirtyMode(true);
        }
    }
    var init_iTestAssetController = function (_options) {

        try {
            iTestAssetController.getAssetData(function (data) {
                if (data) {
                    if (data.length > 0) {
                        data = data.replace(/'/g, '"');
                    }
                    state = JSON.parse(data);
                }
                else {
                    setPrisetData();
                }
                showSaveBtn = !iTestAssetController.isAutoSaveAnswerData();
                init(_options);
                defultState = app.createPreset();
                iTestAssetController.setDirtyMode(false);
            });
        } catch (e) {
            console.log(e);
            setPrisetData();
            if (state.debugMode != 'undefined' && state.debugMode == 1) {
                is_enable = true;

            }
        }
        iTestAssetController.listenToMode(listenToMode_callback);
        iTestAssetController.listenToCreateState(listenToCreateState);


        iTestAssetController.old_isDirty = iTestAssetController.isDirty;
        iTestAssetController.isDirty = function () {
            listenToIsDirty();
            return iTestAssetController.old_isDirty();
        };
    };
    //#endregion iTestAssetController

    this.startover = function () {
        chemicalGeneratorContainer.find('.ChemicalGenerator-startover_masseg').show('fade', {}, 500);
    };
    this.init = init;
    this.init_iTestAssetController = init_iTestAssetController;
    this.createPreset = function (presetForExam) {
        var p = JSON.parse(JSON.stringify(state));
        p.chemicalProcess.process = [];
        p.HessLaw.process = [];
        p.calcTable.process = [];
        p.EnergyGraph.process = [];
        p.degreesOfOxidation.data = {};
        p.HessLaw.lines = [];
        p.EnergyGraph.lines = [];
        p.EnergyGraph.arrows = [];

        var processes = chemicalGeneratorContainer.find('.ChemicalGenerator-desktop .ChemicalGenerator-desktop_layer-container .ChemicalGenerator-desktop_chemicalProces:not(".LineWrapper"):not(".ArrowWrapper"):not("#dH_box")');
        for (var i = 0; i < processes.length; i++) {
            var _p = {};
            var pros = processes.eq(i);
            var intersection = eval(pros.attr('data-intersection'));
            _p.left = intersection[0];
            _p.top = intersection[1];
            _p.data = [];
            var fragments = pros.children('.ChemicalGenerator-desktop_chemicalProces-fragment');
            var setFragmentsData = function (insertTo, elements) {
                for (var f = 0; f < elements.length; f++) {
                    var frag = elements.eq(f);
                    var cf = frag.find('.ChemicalGenerator-desktop_chemicalProces-fragment--center .ChemicalGenerator-desktop_chemicalProces-segment:not(.ChemicalGenerator-desktop_chemicalProces-segment--empty)');
                    if (cf.length > 0) {
                        var fd = { center: [] };
                        for (var s = 0; s < cf.length; s++) {
                            var sig = cf.eq(s);
                            var text = sig.text();
                            if (text == "==>" || text.startsWith("==>")) {
                                text = "==";
                            }

                            if (sig.is('[data-oxidationindex]')) {
                                fd.center.push([text, 'c' + sig.attr('data-oxidationindex')]);
                            }
                            else if (sig.is('[data-oxidationextraindex]')) {
                                fd.center.push([text, 'e' + sig.attr('data-oxidationextraindex')]); //extra -oxy
                            }
                            else if (text == "==") {
                                var prestValue = presetForExam ? sig.find('input').val() : sig.find('input').attr('b_arrow_data');
                                fd.center.push([text, sig.find('input').val(), prestValue]);
                            }
                            else if (text == "fraction") {
                                fd.center.push([text, sig.find('input').eq(0).val(), sig.find('input').eq(1).val()]);
                            }
                            else {
                                fd.center.push(text);
                            }
                        }
                        insertTo.push(fd);
                    }
                    else {
                        var fd = { top: [], bottom: [] };

                        var tf = frag.find('.ChemicalGenerator-desktop_chemicalProces-fragment--top .ChemicalGenerator-desktop_chemicalProces-segment:not(.ChemicalGenerator-desktop_chemicalProces-segment--empty)');
                        for (var s = 0; s < tf.length; s++) {
                            var sig = tf.eq(s);
                            var text = sig.text();
                            fd.top.push(text);
                        }
                        var bf = frag.find('.ChemicalGenerator-desktop_chemicalProces-fragment--bottom .ChemicalGenerator-desktop_chemicalProces-segment:not(.ChemicalGenerator-desktop_chemicalProces-segment--empty)');
                        for (var s = 0; s < bf.length; s++) {
                            var sig = bf.eq(s);
                            var text = sig.text();
                            fd.bottom.push(text);
                        }

                        if (fd.top.length > 0 || fd.bottom.length > 0) {
                            insertTo.push(fd);
                        }
                    }
                }
            };
            setFragmentsData(_p.data, fragments);
          
            
            _p.swapped = typeof (pros.attr('swapped')) != 'undefined';
            var dh = pros.find('.ChemicalGenerator-desktop_chemicalProces_dH');
            var v_dh_initial_index = presetForExam ? dh.find('input').eq(0).val() : "";
            var v_dh_initial_data = presetForExam ? dh.find('input').eq(1).val() : "";
            _p.dH = { visible: typeof (pros.attr('dh_shown')) != 'undefined', dh_index: dh.find('input').eq(0).val(), dH_data: dh.find('input').eq(1).val(), dh_initial_index: v_dh_initial_index, dh_initial_data: v_dh_initial_data };
            
            if ($(processes[i]).hasClass('HessLawElement')) {
                // If process contains deleted molecules - update their indexes in the preset
                if ($(processes[i]).find('.ChemicalGenerator_Molecule').length > 0) {
                    _p.Deleted = "";
                    var fragments = $(processes[i]).find('.ChemicalGenerator-desktop_chemicalProces-fragment');
                    var lastIndex = -1;
                    for (var j = 0; j < fragments.length; j++) {
                        if ($(fragments[j]).parent().is('.ChemicalGenerator_Molecule')) {
                            if (lastIndex != -1) {
                                if (lastIndex == j - 1)
                                    _p.Deleted += ',';
                                else
                                    _p.Deleted += ';';
                            }
                            _p.Deleted += j;
                            lastIndex = j;
                        }
                    }
                }
                p.HessLaw.process.push(_p);
            }
            else if ($(processes[i]).hasClass('EnergyGraphElement'))
                p.EnergyGraph.process.push(_p);
            else if ($(processes[i]).hasClass('calcTableElement')) {   //'calcTable'            
                 p.calcTable.process.push(_p);
                _p.dH = [];
                _p.table_data = {};
                _p.table_data.header = [];
                _p.table_data.rows = [];
                _p.table_data.col_border_index = [];
                var oldData = pros.find('.calcTableTbl').clone();
                oldData = addComboSelectedDataToRow(oldData, pros);
                var row_header = oldData.find('.row_header ');
                var header_count = oldData.find('.row_header .col').length;
                if (header_count > 0) {
                    for (var j = 0; j < header_count - 4; j++) {
                        var row_header_col = row_header.find('.col_i-' + j);
                        var header_col_fragments = row_header_col.find('.ChemicalGenerator-desktop_chemicalProces-fragment');
                        var header_data = [];
                        setFragmentsData(header_data, header_col_fragments);
                        if (row_header_col.hasClass('col_border')) {
                            _p.table_data.col_border_index.push(j);
                        }
                        _p.table_data.header.push(header_data);
                    }
                    for (var j = 0; j < oldData.find('.row').length; j++) {
                        var row_data = [];
                        var row = $(oldData.find('.row')[j]);
                        for (var k = 0; k < row.find('.col').length - 4; k++) {
                            var column = row.find('.col_i-' + k).find('.ChemicalGenerator-desktop_chemicalProces-fragment');
                            var colData = [];
                            setFragmentsData(colData, column);
                            row_data.push(colData);
                        }
                        var row_new = { "combo1": row.attr('col_combo1'), "combo2": row.attr('col_combo2'), "data": row_data };
                        _p.table_data.rows.push(row_new);
                    }
                }
            }
            else //'chemicalProcess'
                p.chemicalProcess.process.push(_p);

            var oxidations = pros.find('.ChemicalGenerator-desktop_degreesOfOxidations .ChemicalGenerator-desktop_degreesOfOxidation');
            for (var o = 0; o < oxidations.length; o++) {
                var oxid = oxidations.eq(o);
                var oxidD = [];
                oxidD[0] = [];
                oxid.children('.ChemicalGenerator-desktop_degreesOfOxidation-num').find('.ChemicalGenerator-desktop_degreesOfOxidation-num-input input').map(function () {
                    oxidD[0].push($(this).val());
                });
                oxidD[1] = {
                    isBottom: oxid.is('.ChemicalGenerator-desktop_degreesOfOxidation--bottom')
                };
                var resizer = oxid.find('.ChemicalGenerator-desktop_degreesOfOxidation-resize');
                if (resizer.length > 0) {
                    oxidD[1].height = resizer[0].style.height;
                    if (oxid.attr('extra_oxidation') != undefined) {
                        oxidD[1].extra_starts_from = oxid.attr('extra_oxidation');
                        var extra_oxy = oxid.find('.ChemicalGenerator-desktop_degreesOfOxidation_extra');
                        oxidD[1].text_extra = extra_oxy.find('.ChemicalGenerator-desktop_degreesOfOxidation-input input').val();
                        oxidD[1].extra_num_input = extra_oxy.find('.ChemicalGenerator-desktop_degreesOfOxidation-num  .ChemicalGenerator-desktop_degreesOfOxidation-num-input input').val();
                        oxidD[1].extra_num_input_left = extra_oxy.find('.ChemicalGenerator-desktop_degreesOfOxidation-num  .ChemicalGenerator-desktop_degreesOfOxidation-num-input-left input').val();
                    }
                }
                var textInput = oxid.children('.ChemicalGenerator-desktop_degreesOfOxidation-input').find('input');
                if (textInput.length > 0) {
                    oxidD[1].text = textInput.val();
                }
                oxidD[2] = [];
                oxid.children('.ChemicalGenerator-desktop_degreesOfOxidation-num').find('.ChemicalGenerator-desktop_degreesOfOxidation-num-input-left input').map(function () {
                    oxidD[2].push($(this).val());
                });
                p.degreesOfOxidation.data['c' + oxid.attr('data-oxidationindex')] = oxidD;
            }
        }

        // Add the summary lines to the answer (preset)
        var lines = chemicalGeneratorContainer.find(".LineWrapper");
        for (var i = 0; i < lines.length; i++) {
            var line = {};
            line.left = parseFloat(lines[i].style['left']);
            line.top = parseFloat(lines[i].style['top']);

            var summaryLine = $(lines[i]).find('.ChemicalGenerator-desktop_SummaryLine');
            // the default width of a summary line is 10em

            if (summaryLine[0].style['width']) {
                if (summaryLine[0].style['width'].includes('px'))
                    line.width = parseFloat(summaryLine[0].style['width']) / 10
                else if (summaryLine[0].style['width'].includes('em'))
                    line.width = parseFloat(summaryLine[0].style['width'])
            }
            else {
                line.width = 10;
            }

            if ($(lines[i]).hasClass('HessLawElement'))
                p.HessLaw.lines.push(line);
            else if ($(lines[i]).hasClass('EnergyGraphElement'))
                p.EnergyGraph.lines.push(line);
        }

        // Add the arrows lines to the answer (preset)
        var arrows = chemicalGeneratorContainer.find(".ArrowWrapper");
        for (var i = 0; i < arrows.length; i++) {
            var arrow = {};
            arrow.left = parseFloat(arrows[i].style['left']);
            arrow.top = parseFloat(arrows[i].style['top']);

            var processArrow = $(arrows[i]).find('.ChemicalGenerator-desktop_Arrow');
            // the default height of an arrow height is 13.5em

            if (processArrow[0].style['height']) {
                if (processArrow[0].style['height'].includes('px'))
                    arrow.height = parseFloat(processArrow[0].style['height']) / 10
                else if (processArrow[0].style['height'].includes('em'))
                    arrow.height = parseFloat(processArrow[0].style['height'])
            }
            else {
                arrow.height = 13.5;
            }

            if (processArrow.is('[class$="Up"]'))
                arrow.direction = 'Up';
            else if (processArrow.is('[class$="Down"]'))
                arrow.direction = 'Down';

            if (processArrow.is('[class*="grey"]'))
                arrow.color = "grey";
            if (processArrow.is('[class*="orange"]'))
                arrow.color = "orange";
            if (processArrow.is('[class*="turquoise"]'))
                arrow.color = "turquoise";
            

            if (arrows[i].getAttribute('dh_shown') == 'true') {
                arrow.dH = {
                    "visible": true,
                    "dh_index": $(arrows[i]).find('.dH_index')[0].value,
                    "dH_data": $(arrows[i]).find('.dH_data')[0].value,
                    "dh_initial_index": $(arrows[i]).find('.dH_index')[0].value,
                    "dh_initial_data": $(arrows[i]).find('.dH_data')[0].value,
                };
            }
            p.EnergyGraph.arrows.push(arrow);
        }               

        var keyboardStyle = chemicalGeneratorContainer.find('.ChemicalGenerator-desktop  .ChemicalGenerator-desktop_layer-tools .ChemicalGenerator-desktop_keyboard')[0].style;
        if ('top' in keyboardStyle && keyboardStyle.top != "") {
            p.keyboard.top = keyboardStyle.top;
        }
        if ('left' in keyboardStyle && keyboardStyle.left != "") {
            p.keyboard.left = keyboardStyle.left;
        }

        var s = 'var AppPriset = ' + JSON.stringify(p, null, '\t');
        if (presetForExam) {
            console.log(s);
        }
        return JSON.stringify(p);
    };
};

var init_grid = function (options) {
    var dom = '<div id="main-app-grid" class="app-center-wrapper science">\
        <div class="app-container">\
            <div class="app-content"><div class="game-container grid-scale-em allow-scroll"></div></div>\
        </div>\
    </div>';
    dom = $(dom);
    dom.find('.app-content').attr('data-width', options.width);
    dom.find('.app-content').attr('data-height', options.height);
    $('body').prepend(dom);


    var brwsrs = ["Chrome", "MSIE", "Trident", "Firefox", "Safari", "Opera"];
    var brwsr = "";
    for (var i = 0; i < brwsrs.length; i++) {
        if (navigator.userAgent.indexOf(brwsrs[i]) !== -1) {
            brwsr = brwsrs[i];
            break;
        }
    }
    if (brwsr === "Trident") brwsr = "MSIE";
    $("html").attr('data-browser', brwsr);
    if (brwsr === "MSIE") $('.game-container.ie-grid').removeClass('grid-scale-em').addClass('grid-scale');
    document.onselectstart = function () { return false };
    if (($('.allow-scroll').length < 1) && ($('.no-scroll-prevention').length < 1)) {
        if (Modernizr.touch) {
            document.addEventListener("touchmove", function TouchHandler(e) { e.preventDefault(); }, true);
        }
    }

    var cet = cet || {};
    cet.params = {
        "$type": "System.Collections.Generic.Dictionary`2[[System.String, mscorlib],[System.String, mscorlib]], mscorlib"
    };
    options.lang = options.translations.lang;
    cet.grid = new options.cetGrid({ gridSelector: "#main-app-grid", translations: options.translations });
    cet._swfFileName = '';
    cet.lang = options.lang;
    var skin = cet.grid.urlParam('skin');
    if (skin) {
        $("body").addClass(skin);
    }
    cet.grid.basefont = 1;
    cet.grid.onReady = function (appWidth, appHeight, appRatio) {
        var cont = dom.find('.app-content .game-container').find('*').first();
        cont.css('opacity', 0);
        options.onReady();
    };

    dom.find('.app-content .game-container').html(options.container);
    dom.find('.app-header .app-title').html(options.translations.title);
    dom.find('#startover').attr('title', options.translations.restart);
    dom.find('#fullscreen').attr('title', options.translations.fullscreen);

    dom.on("click", '#fullscreen', function (e) {
        cet.grid.toggleFullScreen();
    });
    dom.on("click", '#startover', function (e) {
        options.onStartoverClick();
    });

    var show_fullscreen = cet.grid.urlParam('fullscreen');
    if (!show_fullscreen || show_fullscreen == 'false') {
        dom.find('#fullscreen').remove();
    }

    cet.grid.init();


    $(document).keypress(function (e) {
        if ('ChemicalGeneratorKeypress' in window) {
            window.ChemicalGeneratorKeypress(e);
        }
    });
    $(document).keydown(function (e) {
        if ((e.keyCode >= 37 && e.keyCode <= 40) || e.keyCode == 8) {
            if ('ChemicalGeneratorArrowKeypress' in window) {
                window.ChemicalGeneratorArrowKeypress(e);
            }
        }
    });
};
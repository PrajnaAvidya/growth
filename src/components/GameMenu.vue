<template>
    <div>
        <v-btn small default class="blue" v-on:click="menu = true">Menu</v-btn>

        <v-dialog v-model="menu" fullscreen transition="dialog-bottom-transition" :overlay=false
        scrollable>
            <v-card>
                <v-toolbar style="flex: 0 0 auto;" class="primary">
                    <v-btn icon @click.native="menu = false">
                        <v-icon>close</v-icon>
                    </v-btn>
                    <v-toolbar-title>Menu</v-toolbar-title>
                </v-toolbar>

                <v-tabs v-model="activeTab">
                    <v-tabs-bar class="blue">
                        <v-tabs-slider color="red"></v-tabs-slider>
                        <v-tabs-item href="#options">
                            <span class="tab-heading">Options</span>
                        </v-tabs-item>
                        <v-tabs-item href="#stats">
                            <span class="tab-heading">Statistics</span>
                        </v-tabs-item>
                        
                    </v-tabs-bar>

                    <v-tabs-items>
                        <v-tabs-content id="options">
                            <v-card-text>
                                <v-list three-line subheader>
                                    <v-subheader>Options</v-subheader>

                                    <v-list-tile>
                                        <v-list-tile-action>
                                            <v-checkbox v-model="options" value="notation"></v-checkbox>
                                        </v-list-tile-action>
                                        <v-list-tile-content>
                                            <v-list-tile-title>Scientific Notation</v-list-tile-title>
                                            <v-list-tile-sub-title>Show scientific notation instead of names?</v-list-tile-sub-title>
                                        </v-list-tile-content>
                                    </v-list-tile>
                                </v-list>

                                <v-btn color="red" @click.native="hardReset()">Hard Reset</v-btn>
                            </v-card-text>
                        </v-tabs-content>

                        <v-tabs-content id="stats">
                            <v-card-text>
                                <v-list three-line subheader>
                                    <v-subheader>Statistics</v-subheader>

                                    <v-list-tile>
                                        Stuff: {{ getStat('stuff') }}
                                    </v-list-tile>

                                    <v-list-tile>
                                        Stuff per Second: {{ getStat('stuffPerSecond') }}
                                    </v-list-tile>

                                    <v-list-tile>
                                        Highest Stuff Achieved: {{ getStat('highestStuff') }}
                                    </v-list-tile>

                                    <v-list-tile>
                                        Highest Stuff per Second Achieved: {{ getStat('highestStuffPerSecond') }}
                                    </v-list-tile>

                                    <v-list-tile>
                                        Time Played: {{ getStat('timePlayed') }}
                                    </v-list-tile>

                                    <v-list-tile v-if="getStat('timesPrestiged') > 0">
                                        Time Played (this reset): {{ getStat('timePlayedThisPrestige') }}
                                    </v-list-tile>

                                    <v-list-tile v-if="getStat('timesPrestiged') > 0">
                                        Times Reset: {{ getStat('timesPrestiged') }}
                                    </v-list-tile>

                                    <v-list-tile v-if="getStat('timesPrestiged') > 0">
                                        Total Stuff Across All Resets: {{ getStat('totalStuff') }}
                                    </v-list-tile>
                                </v-list>
                            </v-card-text>
                        </v-tabs-content>
                    </v-tabs-items>
                </v-tabs>

                <div style="flex: 1 1 auto;"></div>
            </v-card>
        </v-dialog>
    </div>
</template>

<script>
    import EventBus from '../modules/eventBus.js';
    import Options from '../modules/options.js';
    import Stats from "../modules/stats.js";
    import Utils  from "../modules/utils.js";

    export default {
        data() {
            return {
                menu: false,
                activeTab: null,
                options: [],
                stats: {},
                watchOptions: true,
            }
        },

        watch: {
            // update options when changed
            options: function(settings) {
                if (this.watchOptions) {
                    let optionsObject = {};
                    for (let setting in Options.state) {
                        optionsObject[setting] = settings.includes(setting);
                    }
                    Options.replaceState(optionsObject);
                }
            }
        },

        methods: {
            hardReset() {
                if (confirm("Are you sure?")) {
                    if(confirm("Are you REALLY sure? You will lose EVERYTHING for hard resetting with no prestige bonus!")) {
                        // TODO
                        EventBus.$emit('hardReset');
                    }
                }
            },
            closeMenu() {
                this.menu = false;
            },
            getStat(stat) {
                return this.stats[stat];
            },
            updateStats() {
                this.stats = {};
                for (let key in Stats.state) {
                    if (key == 'timePlayed' || key == 'timePlayedThisPrestige') {
                        this.stats[key] = Stats.state[key].toString() + ' seconds';
                    } else if (key == 'timesPrestiged') {
                        this.stats[key] = Stats.state[key].toString();
                    } else {
                        this.stats[key] = Utils.round(Stats.state[key], true);
                    }
                }

                // compute total stuff earned
                this.stats['totalStuff'] = Utils.round(Stats.state.stuff.plus(Stats.state.totalStuffOldPrestiges));
            },
            updateOptions() {
                this.watchOptions = false;
                this.options = [];
                for (let key in Options.state) {
                    if (Options.state[key] == true) {
                        this.options.push(key);
                    }
                }
                this.watchOptions = true;
            }
        },

        mounted() {
            // events
            let vm = this;
            EventBus.$on('closeMenu', this.closeMenu);
            EventBus.$on('updateOptions', function () {
                vm.updateOptions();
            });
            EventBus.$on('updateStats', function () {
                vm.updateStats();
            });
        }
    };
</script>

<style>
    .game-menu {
        margin-top: 30px;
    }
    .tab-heading {
        color: black;
    }
</style>

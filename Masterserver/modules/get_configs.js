//var ltxElement = require('ltx').Element
var ltx = require('ltx')
var elementGetConfigs = ltx.parse(`<get_configs code='3' from='0' to='3' hash='0'>
<regions default_region="global">
<distances>
<distance from="krasnodar" to="global" value="20"/>
<distance from="novosibirsk" to="global" value="50"/>
<distance from="ekaterinburg" to="global" value="30"/>
<distance from="vladivostok" to="global" value="110"/>
<distance from="khabarovsk" to="global" value="110"/>
<distance from="novosibirsk" to="ekaterinburg" value="20"/>
<distance from="novosibirsk" to="vladivostok" value="180"/>
<distance from="novosibirsk" to="khabarovsk" value="150"/>
<distance from="novosibirsk" to="krasnodar" value="70"/>
<distance from="vladivostok" to="ekaterinburg" value="160"/>
<distance from="vladivostok" to="khabarovsk" value="12"/>
<distance from="vladivostok" to="krasnodar" value="135"/>
<distance from="ekaterinburg" to="khabarovsk" value="140"/>
<distance from="ekaterinburg" to="krasnodar" value="50"/>
<distance from="khabarovsk" to="krasnodar" value="120"/>
</distances>
</regions>
<votes>
<kickvote can_be_started_after_sec="0" cooldown_sec="300" enabled="1" success_threshold="0.8" timeout_sec="60"/>
<surrendervote can_be_started_after_sec="30" cooldown_sec="120" enabled="1" success_threshold="0.6" timeout_sec="60"/>
<pausevote can_be_started_after_sec="360" cooldown_sec="120" max_successful_votings_per_team="1" room_cooldown_on_success="30" room_cooldown_sec="300" success_threshold="0.6" timeout_sec="60"/>
</votes>
<gamepause pause_duration_sec="120">
<allowedfor game_modes="" room_type="PvP_Autostart"/>
<allowedfor game_modes="ptb,tbs,ctf" room_type="PvP_ClanWar"/>
<allowedfor game_modes="ptb,tbs,ctf" room_type="PvP_Public"/>
<allowedfor game_modes="ptb,tbs,ctf" room_type="PvP_Rating"/>
</gamepause>
<ratingseason enabled="1" announcement_end_date="2021-10-08T14:55" games_end_date="2022-09-20T14:05"/>
<lobby_chat>
<anti_spam level_threshold="5">
<channel_delay channel="global" frequency_high="2500" frequency_low="3599000" notification_timeout="3000"/>
<channel_delay channel="room" frequency_high="0" frequency_low="0" notification_timeout="0"/>
<channel_delay channel="team" frequency_high="0" frequency_low="0" notification_timeout="0"/>
<channel_delay channel="whisper" frequency_high="2500" frequency_low="2500" notification_timeout="3000"/>
<channel_delay channel="clan" frequency_high="2500" frequency_low="4500" notification_timeout="3000"/>
</anti_spam>
</lobby_chat>
<card_exchange_config>
<free_card name="free_card" />
<leftover_card name="leftover_card" />
<exchange_rates>
<none        free_cards_gain="1" cards_cost="10000" />
<game_money  free_cards_gain="1" cards_cost="20" currency_cost="7000" />
<crown_money free_cards_gain="1" cards_cost="3" currency_cost="35" />
<cry_money   free_cards_gain="5" cards_cost="1"  currency_cost="5" />
</exchange_rates>
</card_exchange_config>
<card_progressions_config>
<progression name="test_card_kn16" cards_required="10" crown_money="500" item="kn02_test" />
<progression name="test_card_pt36" cards_required="20" game_money="3000" item="pt08_test_shop" />
<progression name="test_card_shared_hands_armagedon" cards_required="15" cry_money="90" item="shared_hands_02_test" />
<progression name="test_card_shared_shoes_armagedon" cards_required="15" cry_money="90" item="shared_shoes_test_02" />
<progression name="test_card_soldier_helmet_armagedon" cards_required="15" cry_money="90" item="soldier_helmet_04_test" />
<progression name="test_card_soldier_vest_armagedon" cards_required="15" cry_money="90" item="shared_vest_test_02" />
<progression name="test_card_smg44" cards_required="25" game_money="2000" item="smg42_test_shop" />
<progression name="test_card_sr46" cards_required="25" crown_money="400" item="sr42_test_shop" />
<progression name="ar38_card"  cards_required="1000"   item="ar38_shop" />
<progression name="shg53_card" cards_required="1000"   item="shg53_shop" />
<progression name="smg48_card" cards_required="1000"   item="smg48_shop" />
<progression name="sr49_card"  cards_required="1000"   item="sr49_shop" />	
<progression name="smg50_card" cards_required="1000"   item="smg50_shop" />
<progression name="smg52_card" cards_required="1000"   item="smg52_shop" />
<progression name="ar36_raid02_card"  cards_required="1000"  item="ar36_raid02_shop" />
<progression name="hmg03_raid02_card" cards_required="1000"  item="hmg03_raid02_shop" />
<progression name="shg52_raid02_card" cards_required="1000"  item="shg52_raid02_shop" />
<progression name="smg52_raid02_card" cards_required="1000"  item="smg52_raid02_shop" />
<progression name="sr45_raid02_card"  cards_required="1000"  item="sr45_raid02_shop" />
<progression name="smg51_card"  cards_required="1000"  item="smg51_shop" />
<progression name="shg55_card"  cards_required="1000"  item="shg55_shop" />
<progression name="mg26_card"  cards_required="1000"  item="mg26_shop" />
<progression name="ar36_apache01_card"  cards_required="1000"  item="ar36_apache01_shop" />
<progression name="hmg03_apache01_card" cards_required="1000"  item="hmg03_apache01_shop" />
<progression name="shg52_apache01_card" cards_required="1000"  item="shg52_apache01_shop" />
<progression name="smg52_apache01_card" cards_required="1000"  item="smg52_apache01_shop" />
<progression name="sr45_apache01_card"  cards_required="1000"  item="sr45_apache01_shop" />
</card_progressions_config>
<ranked_games_restricted_equipment>
<items>
<restricted name="claymoreexplosive04_c"/>
<restricted name="claymoreexplosive04"/>
<restricted name="claymoreexplosive02"/>
<restricted name="engineer_helmet_05"/>
<restricted name="engineer_vest_01"/>
<restricted name="engineer_vest_02"/>
<restricted name="explosivegrenade02_c"/>
<restricted name="medic_helmet_04"/>
<restricted name="medic_vest_01"/>
<restricted name="random_box_07"/>
<restricted name="shared_vest_07"/>
<restricted name="sr01"/>
<restricted name="sr01_shop"/>
<restricted name="sniper_helmet_04"/>
<restricted name="sr04"/>
<restricted name="sr04_shop"/>
<restricted name="soldier_helmet_06"/>
<restricted name="pt66"/>
<restricted name="pt66_shop"/>
<restricted name="sr07"/>
<restricted name="sr07_shop"/>
<restricted name="sr12"/>
<restricted name="sr12_shop"/>
<restricted name="shg11_set01"/>
<restricted name="shg11_set01_shop"/>
<restricted name="smg06_set01"/>
<restricted name="smg06_set01_shop"/>
<restricted name="sr01_set01"/>
<restricted name="sr01_set01_shop"/>
<restricted name="ar02_set01"/>
<restricted name="ar02_set01_shop"/>
<restricted name="sr26"/>
<restricted name="sr26_shop"/>
<restricted name="sr15"/>
<restricted name="sr15_shop"/>
<restricted name="claymoreexplosive05"/>
<restricted name="pt29_fld01"/>
<restricted name="pt29_fld01_shop"/>
<restricted name="ar11_rua01"/>
<restricted name="ar11_rua01_shop"/>
<restricted name="sr15_rua01"/>
<restricted name="sr15_rua01_shop"/>
<restricted name="smg08_rua01"/>
<restricted name="smg08_rua01_shop"/>
<restricted name="shg22_rua01"/>
<restricted name="shg22_rua01_shop"/>
<restricted name="coin_01"/>
<restricted name="mission_access_token_04"/>
<restricted name="ar19"/>
<restricted name="ar19_shop"/>
<restricted name="random_box_04"/>
<restricted name="sr04_crown"/>
<restricted name="sr04_crown_shop"/>
<restricted name="sr04_crown02"/>
<restricted name="sr04_crown02_shop"/>
<restricted name="sr04_xmas"/>
<restricted name="sr04_xmas_shop"/>
<restricted name="sr04_cny01"/>
<restricted name="sr04_cny01_shop"/>
<restricted name="sr04_cny01skin_shop"/>
<restricted name="engineer_helmet_crown_01"/>
<restricted name="medic_helmet_crown_01"/>
<restricted name="sniper_helmet_crown_01"/>
<restricted name="soldier_helmet_crown_01"/>
<restricted name="sr33"/>
<restricted name="sr33_shop"/>
<restricted name="sr33_gold01"/>
<restricted name="sr33_gold01_shop"/>
<restricted name="box_ps4_01_sr33"/>
<restricted name="sr33_ps4_01_shop"/>
<restricted name="sr33_ps4_01"/>
<restricted name="sr33_ps4_01skin_shop"/>
<restricted name="random_box_38"/>
<restricted name="sr33_ec01"/>
<restricted name="sr33_ec01_shop"/>
<restricted name="random_box_61"/>
<restricted name="sr36"/>
<restricted name="sr36_shop"/>
<restricted name="sr36_gold01"/>
<restricted name="sr36_gold01_shop"/>
<restricted name="sr01_set01skin_shop"/>
<restricted name="sr04_gold01"/>
<restricted name="sr04_gold01_shop"/>
<restricted name="sr38"/>
<restricted name="sr38_shop"/>
<restricted name="sr38_gold01"/>
<restricted name="sr38_gold01_shop"/>
<restricted name="sr38_jp01skin_shop"/>
<restricted name="sr38_jp01"/>
<restricted name="sr38_jp01_shop"/>
<restricted name="random_box_74"/>
<restricted name="pt18"/>
<restricted name="pt18_shop"/>
<restricted name="sr20"/>
<restricted name="sr20_shop"/>
<restricted name="sr36_set09"/>
<restricted name="sr36_set09_shop"/>
<restricted name="sr36_set09skin_shop"/>
<restricted name="sr26_camo04skin_shop"/>
<restricted name="sr38_set10"/>
<restricted name="sr38_set10_shop"/>
<restricted name="sr38_set10skin_shop"/>
<restricted name="sr15_camo03skin_shop"/>
<restricted name="sr15_camo06skin_shop"/>
<restricted name="sr33_rad01skin_shop"/>
<restricted name="sr33_rad01"/>
<restricted name="sr33_rad01_shop"/>
<restricted name="random_box_rad01_sr33"/>
<restricted name="sr43"/>
<restricted name="sr43_shop"/>
<restricted name="sr43_set12skin_shop"/>
<restricted name="sr43_set12"/>
<restricted name="sr43_set12_shop"/>
<restricted name="sr43_xmas04"/>
<restricted name="sr43_xmas04_shop"/>
<restricted name="sr43_xmas05"/>
<restricted name="sr43_xmas05_shop"/>
<restricted name="sr43_xmas05skin_shop"/>
<restricted name="sr43_xmas04skin_shop"/>
<restricted name="box_xmas05_sr43"/>
<restricted name="sr07_camo08skin_shop"/>
<restricted name="sr07_camo08"/>
<restricted name="sr07_camo08_shop"/>
<restricted name="claymoreexplosive08"/>
<restricted name="sr07_camo09skin_shop"/>
<restricted name="sr07_camo09"/>
<restricted name="sr07_camo09_shop"/>
<restricted name="sr15_bra02"/>
<restricted name="sr15_bra02_shop"/>
<restricted name="shared_vest_bra_01"/>
<restricted name="shg49_xmas"/>
<restricted name="shg49_xmas_shop"/>
<restricted name="box_jp01_sr38"/>
<restricted name="box_xmas04_sr43"/>
<restricted name="box_cny01_sr04"/>
<restricted name="kn20"/>
<restricted name="kn44_fld01"/>
<restricted name="kn42_viet"/>
<restricted name="sr33_ec03skin_shop"/>
<restricted name="sr33_ec03_shop"/>
<restricted name="sr33_ec03"/>
<restricted name="pt40_shop"/>
<restricted name="pt40"/>
<restricted name="pt28_shop"/>
<restricted name="pt28"/>
<restricted name="arl01_pvp"/>
<restricted name="arl01_pvp_shop"/>
<restricted name="arl02_pvp"/>
<restricted name="arl02_pvp_shop"/>
<restricted name="arl02_pvp_green"/>
<restricted name="arl02_pvp_green_shop"/>
<restricted name="ar34_mars01"/>
<restricted name="ar34_mars01_shop"/>
<restricted name="ar34_mars02"/>
<restricted name="ar34_mars02_shop"/>
<restricted name="ar34_mars03"/>
<restricted name="ar34_mars03_shop"/>
<restricted name="ar34_pvp_mars01"/>
<restricted name="ar34_pvp_mars01_shop"/>
<restricted name="ar34_pvp_mars02"/>
<restricted name="ar34_pvp_mars02_shop"/>
<restricted name="ar34_pvp_mars03"/>
<restricted name="ar34_pvp_mars03_shop"/>
<restricted name="ar34_mars01_clean01"/>
<restricted name="ar34_mars01_clean01_shop"/>
<restricted name="ar34_mars02_clean02"/>
<restricted name="ar34_mars02_clean02_shop"/>
<restricted name="ar34_mars03_clean03"/>
<restricted name="ar34_mars03_clean03_shop"/>
<restricted name="sr36_brazil02_shop"/>
<restricted name="sr36_brazil02"/>
<restricted name="sr36_brazil02skin_shop"/>
<restricted name="claymoreexplosive10"/>
<restricted name="sr38_swarm03_shop"/>
<restricted name="sr38_swarm03"/>
<restricted name="sr38_swarm03skin_shop"/>
<restricted name="sr04_heist02"/>
<restricted name="sr04_heist02_shop"/>
<restricted name="sr04_heist02skin"/>
<restricted name="sr04_heist02skin_shop"/>
<restricted name="sr38_heist03"/>
<restricted name="sr38_heist03_shop"/>
<restricted name="sr38_heist03skin"/>
<restricted name="sr38_heist03skin_shop"/>
<restricted name="kn23"/>
<restricted name="sr02_tape02_console_shop"/>
<restricted name="sniper_vest_camo_05_console"/>
<restricted name="soldier_helmet_camo_12_console"/>
<restricted name="soldier_vest_camo_05_console"/>
<restricted name="engineer_helmet_camo_12_console"/>
<restricted name="medic_vest_camo_05_console"/>
<restricted name="engineer_vest_camo_05_console"/>
<restricted name="sniper_helmet_camo_12_console"/>
<restricted name="medic_helmet_camo_12_console"/>
<restricted name="box_sr02_tape02_console"/>
</items>
</ranked_games_restricted_equipment>
<ui_menu_unlock enabled="1">
<unlock screen="navigation_bar" option="Shop" rank="1"/>
<unlock screen="navigation_bar" option="Inventory" rank="0"/>
<unlock screen="navigation_bar" option="Career" rank="2"/>
<unlock screen="navigation_bar" option="Statistics" rank="0"/>
<unlock screen="navigation_bar" option="Clans" rank="11"/>
<unlock screen="lobby_universal" option="Co-Op" rank="0"/>
<unlock screen="lobby_universal" option="SpecialOperations" rank="1"/>
<unlock screen="lobby_universal" option="Versus" rank="1"/>
<unlock screen="lobby_universal" option="BattlePass" rank="2"/>
<unlock screen="lobby_universal" option="Services" rank="11"/>
<unlock screen="lobby_universal" option="RankedVersus" rank="11"/>
</ui_menu_unlock>
<rating_curve>
<win_streak enabled="1" bonus_amount="1" start_from_streak="3" apply_below_rating="5"/>
<rating games_to_win="1" games_count="2" icon="icon_null" description="@ui_playerinfo_rating_description_not_ranked"/>
<rating games_to_win="1" games_count="2" icon="ratingIconCup21" description="@ui_playerinfo_rating_description_cup_21"/>
<rating games_to_win="1" games_count="2" icon="ratingIconCup20" description="@ui_playerinfo_rating_description_cup_20"/>
<rating games_to_win="2" games_count="3" icon="ratingIconCup19" description="@ui_playerinfo_rating_description_cup_19"/>
<rating games_to_win="2" games_count="3" icon="ratingIconCup18" description="@ui_playerinfo_rating_description_cup_18"/>
<rating games_to_win="2" games_count="3" icon="ratingIconCup17" description="@ui_playerinfo_rating_description_cup_17"/>
<rating games_to_win="2" games_count="3" icon="ratingIconCup16" description="@ui_playerinfo_rating_description_cup_16"/>
<rating games_to_win="2" games_count="3" icon="ratingIconCup15" description="@ui_playerinfo_rating_description_cup_15"/>
<rating games_to_win="3" games_count="5" icon="ratingIconCup14" description="@ui_playerinfo_rating_description_cup_14"/>
<rating games_to_win="3" games_count="5" icon="ratingIconCup13" description="@ui_playerinfo_rating_description_cup_13"/>
<rating games_to_win="3" games_count="5" icon="ratingIconCup12" description="@ui_playerinfo_rating_description_cup_12"/>
<rating games_to_win="3" games_count="5" icon="ratingIconCup11" description="@ui_playerinfo_rating_description_cup_11"/>
<rating games_to_win="3" games_count="5" icon="ratingIconCup10" description="@ui_playerinfo_rating_description_cup_10"/>
<rating games_to_win="3" games_count="5" icon="ratingIconCup9" description="@ui_playerinfo_rating_description_cup_9"/>
<rating games_to_win="3" games_count="5" icon="ratingIconCup8" description="@ui_playerinfo_rating_description_cup_8"/>
<rating games_to_win="5" games_count="7" icon="ratingIconCup7" description="@ui_playerinfo_rating_description_cup_7"/>
<rating games_to_win="5" games_count="7" icon="ratingIconCup6" description="@ui_playerinfo_rating_description_cup_6"/>
<rating games_to_win="5" games_count="7" icon="ratingIconCup5" description="@ui_playerinfo_rating_description_cup_5"/>
<rating games_to_win="5" games_count="7" icon="ratingIconCup4" description="@ui_playerinfo_rating_description_cup_4"/>
<rating games_to_win="5" games_count="7" icon="ratingIconCup3" description="@ui_playerinfo_rating_description_cup_3"/>
<rating games_to_win="5" games_count="7" icon="ratingIconCup2" description="@ui_playerinfo_rating_description_cup_2"/>
<rating games_to_win="5" games_count="7" icon="ratingIconCup1" description="@ui_playerinfo_rating_description_cup_1"/>
</rating_curve>
<abuse_manager_config>
<limits reports_per_day="10" reports_per_player="2"/>
<report_types>
<report_type name="cheat" message="@ui_abuse_cheat"/>
<report_type name="spam" message="@ui_abuse_spam"/>
<report_type name="fishing" message="@ui_abuse_fishing"/>
<report_type name="verbal_abuse" message="@ui_abuse_verbal_abuse"/>
<report_type name="other" message="@ui_abuse_other"/>
</report_types>
</abuse_manager_config>
<consecutive_login_bonus enabled="1" schedule="0 5 * * *" expiration="07.00:00:00" streak_expiration="10.00:00:00" use_notification="1">
<streak>
<reward name="daily_bonus_01_01" />
<reward name="daily_bonus_01_02" />
<reward name="daily_bonus_01_03" />
<reward name="daily_bonus_01_04" />
<reward name="daily_bonus_01_05" />
</streak>
<streak>
<reward name="daily_bonus_02_01" />
<reward name="daily_bonus_02_02" />
<reward name="daily_bonus_02_03" />
<reward name="daily_bonus_02_04" />
<reward name="daily_bonus_02_05" />
<reward name="daily_bonus_02_06" />
<reward name="daily_bonus_02_07" />
</streak>
</consecutive_login_bonus>
<rating_season_rule enabled="1" season_id_template="rating_season_2016" banner="PVPratingMatchesBg" description="@ui_rating_game_caption" rules="@ui_rating_game_rules" announcement_end_date="2016-01-01T01:00" games_end_date="2017-12-31T23:00">
<season_result_rewards>
<reward rating_level="1" name="test_rating_season_1place" />
<reward rating_level="2" name="test_rating_season_2place" />
<reward rating_level="3" name="test_rating_season_3place" />
<reward rating_level="4" name="test_rating_season_4place" />
</season_result_rewards>
<rating_achieved_rewards>
<reward rating_level="1" name="test_rating_level_1_achieved" />
<reward rating_level="2" name="test_rating_level_2_achieved" />
<reward rating_level="3" name="test_rating_level_3_achieved" />
<reward rating_level="4" name="test_rating_level_4_achieved" />
<reward rating_level="5" name="test_rating_level_5_achieved" />
<reward rating_level="6" name="test_rating_level_6_achieved" />
<reward rating_level="7" name="test_rating_level_7_achieved" />
<reward rating_level="8" name="test_rating_level_8_achieved" />
<reward rating_level="9" name="test_rating_level_9_achieved" />
<reward rating_level="10" name="test_rating_level_10_achieved" />
<reward rating_level="11" name="test_rating_level_11_achieved" />
<reward rating_level="12" name="test_rating_level_12_achieved" />
<reward rating_level="13" name="test_rating_level_13_achieved" />
<reward rating_level="14" name="test_rating_level_14_achieved" />
<reward rating_level="15" name="test_rating_level_15_achieved" />
<reward rating_level="16" name="test_rating_level_16_achieved" />
<reward rating_level="17" name="test_rating_level_17_achieved" />
<reward rating_level="18" name="test_rating_level_18_achieved" />
<reward rating_level="19" name="test_rating_level_19_achieved" />
<reward rating_level="20" name="test_rating_level_20_achieved" />
<reward rating_level="21" name="test_rating_level_21_achieved" />
</rating_achieved_rewards>
</rating_season_rule>
<profile_progression_config enabled="1">
<tutorial_passed type="tutorial_1" silent="1" special_reward="tutorial_1_completed"/>
<tutorial_passed type="tutorial_2" silent="1" special_reward="tutorial_2_completed"/>
<tutorial_passed type="tutorial_3" silent="1" special_reward="tutorial_3_completed"/>
<tutorial_unlock silent="1" unlock_type="tutorial_1"/>
<class_unlock silent="1" unlock_class="rifleman"/>
<class_unlock silent="1" unlock_class="sniper"/>
<class_unlock silent="1" unlock_class="heavy"/>
<mission_unlock silent="1" unlock_type="trainingmission"/>
<mission_unlock type="trainingmission" max_value="1" pass_value="1" unlock_type="easymission"/>
<mission_unlock type="easymission" max_value="2" pass_value="1" unlock_type="normalmission"/>
<mission_unlock type="normalmission" max_value="3" rank_reached="10" pass_value="1" legacy_diff="normal" unlock_type="hardmission"/>
<mission_unlock silent="1" rank_reached="10" unlock_type="survivalmission"/>
<mission_unlock silent="1" rank_reached="10" unlock_type="campaignsection1"/>
<mission_unlock silent="1" rank_reached="10" unlock_type="campaignsection2"/>
<mission_unlock silent="1" rank_reached="10" unlock_type="campaignsection3"/>
<mission_unlock silent="1" rank_reached="10" unlock_type="campaignsections"/>
<mission_unlock rank_reached="5" silent="1" unlock_type="volcanoeasy"/>
<mission_unlock rank_reached="5" silent="1" unlock_type="volcanonormal"/>
<mission_unlock type="volcanonormal" max_value="1" rank_reached="10" pass_value="1" unlock_type="volcanohard"/>
<class_unlock tutorial_passed="tutorial_2" unlock_class="medic"/>
<class_unlock tutorial_passed="tutorial_3" unlock_class="engineer"/>
<tutorial_unlock rank_reached="2" silent="1" unlock_type="tutorial_2"/>
<tutorial_unlock rank_reached="3" silent="1" unlock_type="tutorial_3"/>
<mission_unlock rank_reached="5" silent="1" unlock_type="zombieeasy"/>
<mission_unlock rank_reached="5" silent="1" unlock_type="zombienormal"/>
<mission_unlock type="zombienormal" max_value="1" rank_reached="10" pass_value="1" unlock_type="zombiehard"/>
<mission_unlock rank_reached="5" silent="1" unlock_type="anubiseasy"/>
<mission_unlock rank_reached="5" silent="1" unlock_type="anubisnormal"/>
<mission_unlock type="anubisnormal" rank_reached="10" max_value="1" pass_value="1" unlock_type="anubishard"/>
<mission_unlock rank_reached="5" silent="1" unlock_type="anubiseasy2"/>
<mission_unlock rank_reached="5" silent="1" unlock_type="anubisnormal2"/>
<mission_unlock type="anubisnormal2" rank_reached="10" max_value="1" pass_value="1" unlock_type="anubishard2"/>
<mission_unlock rank_reached="5" silent="1" unlock_type="zombietowereasy"/>
<mission_unlock rank_reached="5" silent="1" unlock_type="zombietowernormal"/>
<mission_unlock type="zombietowernormal" rank_reached="10" max_value="1" pass_value="1" unlock_type="zombietowerhard"/>
<mission_unlock rank_reached="5" silent="1" unlock_type="icebreakereasy"/>
<mission_unlock rank_reached="5" silent="1" unlock_type="icebreakernormal"/>
<mission_unlock type="icebreakernormal" rank_reached="10" max_value="1" pass_value="1" unlock_type="icebreakerhard"/>
<mission_unlock rank_reached="5" silent="1" unlock_type="chernobyleasy"/>
<mission_unlock rank_reached="5" silent="1" unlock_type="chernobylnormal"/>
<mission_unlock type="chernobylnormal" rank_reached="10" max_value="1" pass_value="1" unlock_type="chernobylhard"/>
<mission_unlock rank_reached="5" silent="1" unlock_type="japaneasy"/>
<mission_unlock rank_reached="5" silent="1" unlock_type="japannormal"/>
<mission_unlock type="japannormal" rank_reached="10" max_value="1" pass_value="1" unlock_type="japanhard"/>
<mission_unlock rank_reached="5" silent="1" unlock_type="marseasy"/>
<mission_unlock rank_reached="5" silent="1" unlock_type="marsnormal"/>
<mission_unlock type="marsnormal" rank_reached="10" max_value="1" pass_value="1" unlock_type="marshard"/>
<mission_unlock rank_reached="5" silent="1" unlock_type="pve_arena"/>
<mission_unlock rank_reached="5" silent="1" unlock_type="blackwood"/>
</profile_progression_config>
<special_reward_configuration hash="611979925">
<event name="zsd_key_bronze" use_notification="0">
<item name="key_zsd01_bronze_01" amount="1"/>
</event>
<event name="zsd_key_silver" use_notification="0">
<item name="key_zsd01_silver_01" amount="1"/>
</event>
<event name="zsd_key_gold" use_notification="0">
<item name="key_zsd01_gold_01" amount="1"/>
</event>
<event name="zsd_gp_150" use_notification="0">
<money currency="game_money" amount="550"/>
</event>
<event name="zsd_gp_350" use_notification="0">
<money currency="game_money" amount="350"/>
</event>
<event name="zsd_gp_550" use_notification="0">
<money currency="game_money" amount="550"/>
</event>
<event name="zsd_mask" use_notification="0">
<item name="shared_helmet_zsd_01" expiration="30d"/>
</event>
<event name="tutorial_1_completed">
<money currency="game_money" amount="3000"/>
<item name="ar03_shop" expiration="5d"/>
<item name="shared_vest_02" expiration="5d"/>
</event>
<event name="tutorial_2_completed">
<money currency="game_money" amount="3000"/>
<item name="shg13_shop" expiration="5d"/>
<item name="pt02_shop" expiration="5d"/>
</event>
<event name="tutorial_3_completed">
<money currency="game_money" amount="3000"/>
<item name="smg02_shop" expiration="5d"/>
<item name="shared_shoes_05" expiration="5d"/>
</event>
<event name="new_player_bonus">
<item name="coin_01" amount="5"/>
</event>
<event name="daily_bonus">
<item name="coin_01" amount="1"/>
</event>
<event name="daily_bonus_igr">
<money currency="game_money" amount="1000"/>
</event>
<event name="newbie_rankup_bonus">
<money currency="game_money" amount="1000"/>
</event>
<event name="daily_mission_access_tokens" use_notification="0">
<item name="mission_access_token_04" amount="2" max_amount="6"/>
</event>
<event name="daily_mission_access_tokens_2" use_notification="0">
<item name="mission_access_token_04" amount="5" max_amount="10"/>
</event>
<event name="survival_mission_reward">
<item name="random_box_sm_01" regular=""/>
</event>
<event name="rw01_mission_reward">
<item name="random_box_rw_01" regular=""/>
</event>
<event name="rw02_mission_reward">
<item name="random_box_rw_02" regular=""/>
</event>
<event name="rw03_mission_reward">
<item name="random_box_rw_03" regular=""/>
</event>
<event name="rw04_mission_reward">
<item name="random_box_rw_04" regular=""/>
</event>
<event name="volcano_easy_mission_reward">
<item name="random_box_vc_01" regular=""/>
</event>
<event name="volcano_normal_mission_reward">
<item name="random_box_vc_02" regular=""/>
</event>
<event name="volcano_hard_mission_reward">
<item name="random_box_vc_03" regular=""/>
</event>
<event name="anubis_normal_mission_reward">
<item name="random_box_afro_02" regular=""/>
</event>
<event name="anubis_hard_mission_reward">
<item name="random_box_afro_03" regular=""/>
<item name="box_afro_03_armor_hard" regular=""/>		
</event>
<event name="anubis_normal_2_mission_reward">
<item name="random_box_afro_04" regular=""/>
</event>
<event name="anubis_hard_2_mission_reward">
<item name="random_box_afro_05" regular=""/>
<item name="box_efa_armor_hard" regular=""/>
</event>
<event name="zombie_easy_mission_reward">
<item name="random_box_zsd_01" regular=""/>
</event>
<event name="zombie_normal_mission_reward">
<item name="random_box_zsd_02" regular=""/>
</event>
<event name="zombie_hard_mission_reward">
<item name="random_box_zsd_03" regular=""/>
</event>
<event name="zombietower_easy_mission_reward">
<item name="random_box_zt_01" regular=""/>
</event>
<event name="zombietower_normal_mission_reward">
<item name="random_box_zt_02" regular=""/>
</event>
<event name="zombietower_hard_mission_reward">
<item name="random_box_zt_03" regular=""/>
<item name="box_zt_armor_hard" regular=""/>
</event>
<event name="icebreaker_easy_mission_reward">
<item name="random_box_ib_01" regular=""/>
</event>
<event name="icebreaker_normal_mission_reward">
<item name="random_box_ib_02" regular=""/>
</event>
<event name="icebreaker_hard_mission_reward">
<item name="random_box_ib_03" regular=""/>
<item name="box_ice_armor_hard" regular=""/>
</event>
<event name="chernobyl_easy_mission_reward">
<item name="random_box_rad_01" regular=""/>
</event>
<event name="chernobyl_normal_mission_reward">
<item name="random_box_rad_02" regular=""/>
</event>
<event name="chernobyl_hard_mission_reward">
<item name="random_box_rad_03" regular=""/>
<item name="box_cb_armor_hard" regular=""/>		
</event>
<event name="japan_easy_mission_reward">
<item name="random_box_jpn_01" regular=""/>
</event>
<event name="japan_normal_mission_reward">
<item name="random_box_jpn_02" regular=""/>
</event>
<event name="japan_hard_mission_reward">
<item name="random_box_jpn_03" regular=""/>
<item name="box_jpn_armor_hard" regular=""/>
</event>
<event name="mars_easy_mission_reward">
<item name="random_box_mars_01" regular=""/>
</event>
<event name="mars_normal_mission_reward">
<item name="random_box_mars_02" regular=""/>
</event>
<event name="mars_hard_mission_reward">
<item name="random_box_mars_03" regular=""/>
<item name="box_mars_armor_hard" regular=""/>	
</event>
<event name="pve_arena_1">
<item name="random_box_arena_01" regular=""/>
</event>
<event name="pve_arena_2">
<item name="random_box_arena_02" regular=""/>
</event>
<event name="pve_arena_3">
<item name="random_box_arena_03" regular=""/>
</event>
<event name="pve_arena_4">
<item name="random_box_arena_04" regular=""/>	
</event>
<event name="blackwood_laser">
<item name="random_box_bw_03" regular=""/>
</event>
<event name="blackwood_eye">
<item name="random_box_bw_02" regular=""/>
</event>
<event name="blackwood_teleport">
<item name="random_box_bw_01" regular=""/>
</event>
<event name="bonus_5_1">
<item name="smokegrenade02" expiration="6h"/>
</event>
<event name="bonus_5_2">
<item name="explosivegrenade02_c" amount="2" />
</event>
<event name="bonus_5_3">
<item name="claymoreexplosive04_c" amount="2" />
</event>
<event name="bonus_5_4">
<item name="kn04"  expiration="6h"/>
</event>
<event name="bonus_5_5">
<item name="pt03_shop"  expiration="6h"/>
</event>
<event name="bonus_5_6">
<item name="coin_01" amount="2" />
</event>
<event name="bonus_5_7">
<item name="shared_vest_02" expiration="7d"/>
</event>
<event name="daily_bonus_01_01">
<money currency="game_money" amount="100"/>
</event>
<event name="daily_bonus_01_02">
<item name="coin_01" amount="2" />
</event>
<event name="daily_bonus_01_03">
<item name="pt25_shop" expiration="2d" />
</event>
<event name="daily_bonus_01_04">
<item name="smokegrenade_c" amount="20" />
</event>
<event name="daily_bonus_01_05">
<item name="random_box_daily_01" regular=""/>
</event>
<event name="daily_bonus_02_01">
<money currency="game_money" amount="500"/>
</event>
<event name="daily_bonus_02_02">
<item name="coin_01" amount="2" />
</event>
<event name="daily_bonus_02_03">
<item name="random_box_daily_02" regular=""/>
</event>
<event name="daily_bonus_02_04">
<money currency="game_money" amount="1500"/>
</event>
<event name="daily_bonus_02_05">
<item name="random_box_daily_02" regular=""/>
</event>
<event name="daily_bonus_02_06">
<money currency="crown_money" amount="300"/>
</event>
<event name="daily_bonus_02_07">
<item name="random_box_daily_03" regular=""/>
</event>
<event name="holiday_bonus_01">
<item name="random_box_xmas_01" regular=""/>
</event>
<event name="holiday_bonus_02">
<item name="pt25_xmas03_shop" expiration="7d"/>
</event>
<event name="holiday_bonus_03">
<item name="random_box_xmas_01" regular=""/>
</event>
<event name="holiday_bonus_04">
<item name="smg35_xmas03_shop" expiration="7d"/>
</event>
<event name="holiday_bonus_05">
<item name="random_box_xmas_02" regular=""/>
</event>
<event name="holiday_bonus_06">
<item name="shg43_xmas03_shop" expiration="7d"/>
</event>
<event name="holiday_bonus_07">
<item name="random_box_xmas_01" regular=""/>
</event>
<event name="holiday_bonus_08">
<item name="sr35_xmas03_shop" expiration="7d"/>
</event>
<event name="holiday_bonus_09">
<item name="random_box_xmas_01" regular=""/>
</event>
<event name="holiday_bonus_10">
<item name="ar24_xmas03_shop" expiration="7d"/>
</event>
<event name="holiday_bonus_11">
<item name="random_box_xmas_02" regular=""/>
</event>
<event name="holiday_bonus_12">
<item name="booster_11" expiration="1d"/>
</event>
<event name="rankup_bonus_02" use_notification="0">
<item name="random_box_rank_00" regular=""/>
</event>
<event name="rankup_bonus_03" use_notification="0">
<item name="random_box_rank_00" regular=""/>
</event>
<event name="rankup_bonus_04" use_notification="0">
<item name="random_box_rank_00" regular=""/>
</event>
<event name="rankup_bonus_05" use_notification="0">
<item name="random_box_rank_01" regular=""/>
</event>
<event name="rankup_bonus_06" use_notification="0">
<item name="random_box_rank_01" regular=""/>
<item name="key_bundle_item_17" expiration="1d" use_notification="0"/>
</event>
<event name="rankup_bonus_07" use_notification="0">
<item name="random_box_rank_01" regular=""/>
</event>
<event name="rankup_bonus_08" use_notification="0">
<item name="random_box_rank_01" regular=""/>
</event>
<event name="rankup_bonus_09" use_notification="0">
<item name="random_box_rank_02" regular=""/>
</event>
<event name="rankup_bonus_10" use_notification="0">
<item name="random_box_rank_02" regular=""/>
<item name="key_10th_rank_offer" expiration="1d" use_notification="0"/>
</event>
<event name="rankup_bonus_11" use_notification="0">
<item name="random_box_rank_02" regular=""/>
</event>
<event name="rankup_bonus_12" use_notification="0">
<item name="random_box_rank_02" regular=""/>
</event>
<event name="rankup_bonus_13" use_notification="0">
<item name="random_box_rank_02" regular=""/>
</event>
<event name="rankup_bonus_14" use_notification="0">
<item name="random_box_rank_02" regular=""/>
</event>
<event name="rankup_bonus_15" use_notification="0">
<item name="random_box_rank_02" regular=""/>
</event>
<event name="rankup_bonus_16" use_notification="0">
<item name="random_box_rank_02" regular=""/>
</event>
<event name="rankup_bonus_17" use_notification="0">
<item name="random_box_rank_02" regular=""/>
</event>
<event name="rankup_bonus_18" use_notification="0">
<item name="random_box_rank_02" regular=""/>
</event>
<event name="rankup_bonus_19" use_notification="0">
<item name="random_box_rank_02" regular=""/>
</event>
<event name="rankup_bonus_20" use_notification="0">
<item name="random_box_rank_02" regular=""/>
</event>
<event name="rankup_bonus_21" use_notification="0">
<item name="random_box_rank_02" regular=""/>
</event>
<event name="rankup_bonus_22" use_notification="0">
<item name="random_box_rank_02" regular=""/>
</event>
<event name="rankup_bonus_23" use_notification="0">
<item name="random_box_rank_02" regular=""/>
</event>
<event name="rankup_bonus_24" use_notification="0">
<item name="random_box_rank_02" regular=""/>
</event>	
<event name="rankup_bonus_25" use_notification="0">
<item name="random_box_rank_02" regular=""/>
<item name="mission_access_token_04" amount="5"/> 
</event>
<event name="rankup_bonus_26" use_notification="0">
<item name="random_box_rank_03" regular=""/>
</event>	
<event name="rankup_bonus_27" use_notification="0">
<item name="random_box_rank_03" regular=""/>	
</event>	
<event name="rankup_bonus_28" use_notification="0">
<item name="random_box_rank_03" regular=""/>
</event>	
<event name="rankup_bonus_29" use_notification="0">
<item name="random_box_rank_03" regular=""/>
</event>	
<event name="rankup_bonus_30" use_notification="0">
<item name="random_box_rank_03" regular=""/>
</event>	
<event name="rankup_bonus_31" use_notification="0">
<item name="random_box_rank_03" regular=""/>
</event>	
<event name="rankup_bonus_32" use_notification="0">
<item name="random_box_rank_03" regular=""/>
</event>	
<event name="rankup_bonus_33" use_notification="0">
<item name="random_box_rank_03" regular=""/>	
</event>	
<event name="rankup_bonus_34" use_notification="0">
<item name="random_box_rank_03" regular=""/>
</event>	
<event name="rankup_bonus_35" use_notification="0">
<item name="random_box_rank_03" regular=""/>
</event>	
<event name="rankup_bonus_36" use_notification="0">
<item name="random_box_rank_03" regular=""/>
</event>	
<event name="rankup_bonus_37" use_notification="0">
<item name="random_box_rank_03" regular=""/>
</event>	
<event name="rankup_bonus_38" use_notification="0">
<item name="random_box_rank_03" regular=""/>
</event>	
<event name="rankup_bonus_39" use_notification="0">
<item name="random_box_rank_03" regular=""/>
</event>	
<event name="rankup_bonus_40" use_notification="0">
<item name="random_box_rank_03" regular=""/>
</event>	
<event name="rankup_bonus_41" use_notification="0">
<item name="random_box_rank_03" regular=""/>
</event>	
<event name="rankup_bonus_42" use_notification="0">
<item name="random_box_rank_03" regular=""/>
</event>
<event name="rankup_bonus_43" use_notification="0">
<item name="random_box_rank_03" regular=""/>
</event>
<event name="rankup_bonus_44" use_notification="0">
<item name="random_box_rank_03" regular=""/>
</event>
<event name="rankup_bonus_45" use_notification="0">
<item name="random_box_rank_03" regular=""/>
</event>
<event name="rankup_bonus_46" use_notification="0">
<item name="random_box_rank_03" regular=""/>
</event>
<event name="rankup_bonus_47" use_notification="0">
<item name="random_box_rank_03" regular=""/>
</event>
<event name="rankup_bonus_48" use_notification="0">
<item name="random_box_rank_03" regular=""/>
</event>
<event name="rankup_bonus_49" use_notification="0">
<item name="random_box_rank_03" regular=""/>
</event>
<event name="rankup_bonus_50" use_notification="0">
<item name="random_box_rank_03" regular=""/>
</event>
<event name="rankup_bonus_51" use_notification="0">
<item name="random_box_rank_03" regular=""/>
</event>
<event name="rankup_bonus_52" use_notification="0">
<item name="random_box_rank_03" regular=""/>
</event>
<event name="rankup_bonus_53" use_notification="0">
<item name="random_box_rank_03" regular=""/>
</event>
<event name="rankup_bonus_54" use_notification="0">
<item name="random_box_rank_03" regular=""/>
</event>
<event name="rankup_bonus_55" use_notification="0">
<item name="random_box_rank_03" regular=""/>
</event>
<event name="rankup_bonus_56" use_notification="0">
<item name="random_box_rank_03" regular=""/>
</event>	
<event name="rankup_bonus_57" use_notification="0">
<item name="random_box_rank_03" regular=""/>
</event>	
<event name="rankup_bonus_58" use_notification="0">
<item name="random_box_rank_03" regular=""/>
</event>	
<event name="rankup_bonus_59" use_notification="0">
<item name="random_box_rank_03" regular=""/>
</event>	
<event name="rankup_bonus_60" use_notification="0">
<item name="random_box_rank_04" regular=""/>
</event>	
<event name="rankup_bonus_61" use_notification="0">
<item name="random_box_rank_04" regular=""/>
</event>	
<event name="rankup_bonus_62" use_notification="0">
<item name="random_box_rank_04" regular=""/>
</event>	
<event name="rankup_bonus_63" use_notification="0">
<item name="random_box_rank_04" regular=""/>
</event>	
<event name="rankup_bonus_64" use_notification="0">
<item name="random_box_rank_04" regular=""/>
</event>
<event name="rankup_bonus_65" use_notification="0">
<item name="random_box_rank_04" regular=""/>
</event>
<event name="rankup_bonus_66" use_notification="0">
<item name="random_box_rank_04" regular=""/>
</event>
<event name="rankup_bonus_67" use_notification="0">
<item name="random_box_rank_04" regular=""/>
</event>
<event name="rankup_bonus_68" use_notification="0">
<item name="random_box_rank_04" regular=""/>
</event>	
<event name="rankup_bonus_69" use_notification="0">
<item name="random_box_rank_04" regular=""/>
</event>	
<event name="rankup_bonus_70" use_notification="0">
<item name="random_box_rank_04" regular=""/>
</event>		
<event name="rankup_bonus_71" use_notification="0">
<item name="random_box_rank_04" regular=""/>
</event>	
<event name="rankup_bonus_72" use_notification="0">
<item name="random_box_rank_04" regular=""/>
</event>
<event name="rankup_bonus_73" use_notification="0">
<item name="random_box_rank_04" regular=""/>
</event>
<event name="rankup_bonus_74" use_notification="0">
<item name="random_box_rank_04" regular=""/>
</event>
<event name="rankup_bonus_75" use_notification="0">
<item name="random_box_rank_04" regular=""/>
</event>
<event name="rankup_bonus_76" use_notification="0">
<item name="random_box_rank_04" regular=""/>
</event>
<event name="rankup_bonus_77" use_notification="0">
<item name="random_box_rank_04" regular=""/>
</event>
<event name="rankup_bonus_78" use_notification="0">
<item name="random_box_rank_04" regular=""/>
</event>
<event name="rankup_bonus_79" use_notification="0">
<item name="random_box_rank_04" regular=""/>
</event>
<event name="rankup_bonus_80" use_notification="0">
<item name="random_box_rank_04" regular=""/>
</event>
<event name="rankup_bonus_81" use_notification="0">
<item name="random_box_rank_05" regular=""/>
</event>
<event name="rankup_bonus_82" use_notification="0">
<item name="random_box_rank_05" regular=""/>
</event>
<event name="rankup_bonus_83" use_notification="0">
<item name="random_box_rank_05" regular=""/>
</event>
<event name="rankup_bonus_84" use_notification="0">
<item name="random_box_rank_05" regular=""/>
</event>
<event name="rankup_bonus_85" use_notification="0">
<item name="random_box_rank_05" regular=""/>
</event>
<event name="rankup_bonus_86" use_notification="0">
<item name="random_box_rank_05" regular=""/>
</event>
<event name="rankup_bonus_87" use_notification="0">
<item name="random_box_rank_05" regular=""/>
</event>
<event name="rankup_bonus_88" use_notification="0">
<item name="random_box_rank_05" regular=""/>
</event>
<event name="rankup_bonus_89" use_notification="0">
<item name="random_box_rank_05" regular=""/>
</event>
<event name="rankup_bonus_90" use_notification="0">
<item name="random_box_rank_05" regular=""/>
</event>
<event name="bonus_1_1">
<item name="pt29_fld01_shop" expiration="1d"/>
<item name="kn44_fld01" expiration="1d"/>
</event>
<event name="key_bundle_item_17" use_notification="0">
<item name="key_bundle_item_17" regular=""/>
</event>
<event name="rating_season_1place">
<achievement id="8035" progress="1"/>
<item name="random_box_dragon_jade" regular=""/>
</event>
<event name="rating_season_2place">
<achievement id="8034" progress="1"/>
</event>
<event name="rating_season_3place">
<achievement id="8034" progress="1"/>
</event>
<event name="rating_season_4place">
<achievement id="8034" progress="1"/>
</event>
<event name="rating_season_5place">
<achievement id="8033" progress="1"/>
</event>
<event name="rating_season_6place">
<achievement id="8033" progress="1"/>
</event>
<event name="rating_season_7place">
<achievement id="8033" progress="1"/>
</event>
<event name="rating_season_8place">
<achievement id="8032" progress="1"/>
</event>
<event name="rating_season_9place">
<achievement id="8032" progress="1"/>
</event>
<event name="rating_season_10place">
<achievement id="8032" progress="1"/>
</event>
<event name="rating_level_1_achieved">
<money currency="game_money" amount="5000"/>
<money currency="crown_money" amount="500"/>
</event>
<event name="rating_level_2_achieved">
<money currency="game_money" amount="1500"/>
<money currency="crown_money" amount="150"/>
</event>
<event name="rating_level_3_achieved">
<money currency="game_money" amount="1500"/>
<money currency="crown_money" amount="150"/>
</event>
<event name="rating_level_4_achieved">
<money currency="game_money" amount="1500"/>
<money currency="crown_money" amount="150"/>
</event>
<event name="rating_level_5_achieved">
<money currency="game_money" amount="1000"/>
<money currency="crown_money" amount="100"/>
</event>
<event name="rating_level_6_achieved">
<money currency="game_money" amount="1000"/>
<money currency="crown_money" amount="100"/>
</event>
<event name="rating_level_7_achieved">
<money currency="game_money" amount="1000"/>
<money currency="crown_money" amount="100"/>
</event>
<event name="rating_level_8_achieved">
<money currency="game_money" amount="1000"/>
<money currency="crown_money" amount="100"/>
</event>
<event name="rating_level_9_achieved">
<money currency="game_money" amount="1000"/>
<money currency="crown_money" amount="100"/>
</event>
<event name="rating_level_10_achieved">
<money currency="game_money" amount="750"/>
<money currency="crown_money" amount="75"/>
</event>
<event name="rating_level_11_achieved">
<money currency="game_money" amount="750"/>
<money currency="crown_money" amount="75"/>
</event>
<event name="rating_level_12_achieved">
<money currency="game_money" amount="750"/>
<money currency="crown_money" amount="75"/>
</event>
<event name="rating_level_13_achieved">
<money currency="game_money" amount="750"/>
<money currency="crown_money" amount="75"/>
</event>
<event name="rating_level_14_achieved">
<money currency="game_money" amount="750"/>
<money currency="crown_money" amount="75"/>
</event>
<event name="rating_level_15_achieved">
<money currency="game_money" amount="500"/>
<money currency="crown_money" amount="50"/>
</event>
<event name="rating_level_16_achieved">
<money currency="game_money" amount="500"/>
<money currency="crown_money" amount="50"/>
</event>
<event name="rating_level_17_achieved">
<money currency="game_money" amount="500"/>
<money currency="crown_money" amount="50"/>
</event>
<event name="rating_level_18_achieved">
<money currency="game_money" amount="500"/>
<money currency="crown_money" amount="50"/>
</event>
<event name="rating_level_19_achieved">
<money currency="game_money" amount="500"/>
<money currency="crown_money" amount="50"/>
</event>
<event name="rating_level_20_achieved">
<money currency="game_money" amount="500"/>
<money currency="crown_money" amount="50"/>
</event>
<event name="rating_level_21_achieved">
<money currency="game_money" amount="500"/>
<money currency="crown_money" amount="50"/>
</event>
</special_reward_configuration>
<banforleave>
<roomtype ban_trial_period_min="30" name="PvP_Rating" timeout_min="30"/>
<roomtype ban_trial_period_min="2160" exclusions="PVE" name="PvE_AutoStart"/>
<roomtype ban_trial_period_min="2160" exclusions="PVE" name="PvE_Private"/>
<roomtype ban_trial_period_min="4320" exclusions="FFA-HNT-LMS" name="PvP_Autostart" timeout_min="1,1,1,3,5,5,5,5,5,10,15,20,25,30"/>
</banforleave>
</get_configs>`);
exports.module = function (stanza) {
	global.xmppClient.response(stanza, elementGetConfigs);
}
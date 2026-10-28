/* monsters-extra.js - More AD&D 2e monsters for the Monster Manual page, the Battle page and the Bestiary.
   Game statistics (AC, movement, Hit Dice, attacks, damage, XP, morale) summarized from the 2e Monstrous Manual;
   all descriptions are our own short summaries. THAC0 and saving throws are worked out from the Hit Dice
   (2e rule: monsters attack and save as fighters of their Hit Dice). Check your book for full details.
   Loaded right after db.js. Existing entries in db.js are not replaced. */
(function () {
    // [name, category, size, AC, move, HD, #attacks, damage, XP, morale, alignment, frequency, special, immunities, description]
    const ROWS = [
        // ---------- Animals & giant vermin ----------
        ['Ant, Giant', 'Animal', 'T', 3, '18', '2', 1, '1d6', 35, '7', 'Neutral', 'Rare', 'Warrior ants (3 HD): bite 2d4 + sting 3d4 poison', 'None', 'Black or red ants the size of a large dog that swarm from huge underground nests.'],
        ['Ape, Carnivorous', 'Animal', 'L', 6, '12', '5', 3, '1d4/1d4/1d8', 175, '8', 'Neutral', 'Rare', 'Rend for extra 1d8 if both claws hit', 'None', 'Large, cunning man-eating apes that hunt in small groups.'],
        ['Badger, Giant', 'Animal', 'S', 4, '6, Br 3', '3', 3, '1d3/1d3/1d6', 65, '8', 'Neutral', 'Uncommon', 'Fierce burrower, fights to the death to defend its den', 'None', 'A badger the size of a large dog with powerful digging claws.'],
        ['Bear, Black', 'Animal', 'M', 7, '12', '3+3', 3, '1d3/1d3/1d6', 175, '9', 'Neutral', 'Common', 'Hug for 2d4 if a paw hits on 18+', 'None', 'The smallest common bear, shy unless cornered or guarding cubs.'],
        ['Bear, Brown', 'Animal', 'L', 6, '12', '5+5', 3, '1d6/1d6/1d8', 420, '10', 'Neutral', 'Common', 'Hug 2d6 if a paw hits on 18+. Fights 1d4 rounds after reaching 0 to -8 HP', 'None', 'Big, aggressive bears of forests and mountains.'],
        ['Bear, Cave', 'Animal', 'L', 6, '12', '6+6', 3, '1d8/1d8/1d12', 650, '11', 'Neutral', 'Uncommon', 'Hug 2d8 if a paw hits on 18+. Fights on 1d4 rounds at 0 to -8 HP', 'None', 'Huge, bad-tempered bears that lair in caverns.'],
        ['Bear, Polar', 'Animal', 'H', 6, '12, Sw 9', '8+8', 3, '1d10/1d10/2d6', 1400, '12', 'Neutral', 'Uncommon', 'Hug 3d6 if a paw hits on 18+. Excellent swimmer', 'Cold', 'White-furred giants of the arctic ice.'],
        ['Beetle, Bombardier', 'Animal', 'S', 4, '9', '2+2', 1, '2d6', 120, '8', 'Neutral', 'Common', 'Acid cloud 8 ft (2d6, 50% chance per round); noise may stun', 'None', 'Red-shelled beetle that sprays a burning, popping cloud.'],
        ['Beetle, Fire', 'Animal', 'S', 4, '12', '1+2', 1, '2d4', 35, '7', 'Neutral', 'Common', 'Glowing glands give light for 1d6 days after death', 'None', 'Small beetle with red glowing glands, prized by miners.'],
        ['Beetle, Stag', 'Animal', 'L', 3, '6', '7', 3, '4d4/1d10/1d10', 975, '10', 'Neutral', 'Common', 'Powerful horn and mandibles', 'None', 'Huge beetle with enormous antler-like jaws that raids crops.'],
        ['Boar, Wild', 'Animal', 'M', 7, '15', '3+3', 1, '3d4', 175, '9', 'Neutral', 'Common', 'Fights 1d4 rounds after reaching 0 to -6 HP', 'None', 'Short-tempered wild pig with sharp tusks.'],
        ['Boar, Giant', 'Animal', 'L', 6, '12', '7', 1, '3d6', 650, '10', 'Neutral', 'Uncommon', 'Fights 1d4 rounds after reaching 0 to -10 HP', 'None', 'Prehistoric boar the size of an ox.'],
        ['Centipede, Giant', 'Animal', 'T', 9, '15', '1/2', 1, '1', 35, '5', 'Neutral', 'Common', 'Poison: save vs poison +2 or paralyzed 2d6 hours (or 1d3 rounds weak, DM)', 'None', 'Foot-long centipede found in damp ruins.'],
        ['Crab, Giant', 'Animal', 'L', 3, '9', '3', 2, '2d4/2d4', 65, '9', 'Neutral', 'Uncommon', 'Surprise on 1-4 when buried in sand', 'None', 'Shore-dwelling crab big enough to grab a person.'],
        ['Crocodile', 'Animal', 'L', 5, '6, Sw 12', '3', 2, '2d4/1d12', 65, '7', 'Neutral', 'Common', 'Surprise on 1-3 in water; sluggish in cold', 'None', 'Armored river reptile that drags prey under water.'],
        ['Crocodile, Giant', 'Animal', 'H', 4, '6, Sw 12', '7', 2, '3d6/2d10', 650, '9', 'Neutral', 'Rare', 'Surprise on 1-3 in water; can swallow small creatures', 'None', 'Thirty-foot crocodile of tropical swamps and seas.'],
        ['Dog, War', 'Animal', 'M', 6, '12', '2+2', 1, '2d4', 65, '10', 'Neutral', 'Common', 'Often wears spiked collar and leather barding', 'None', 'Large mastiff trained for battle and guard duty.'],
        ['Eagle, Giant', 'Animal', 'L', 7, '3, Fl 48', '4', 3, '1d6/1d6/2d6', 175, '10', 'Neutral good', 'Uncommon', 'Dive: +2 to hit, double claw damage. Sometimes allies of good folk', 'None', 'Intelligent eagle with a 20-foot wingspan.'],
        ['Elephant', 'Animal', 'L', 6, '15', '11', 5, '2d8/2d8/2d6/2d6/2d6', 2000, '8', 'Neutral', 'Uncommon', 'Up to 2 attacks on one foe; trample', 'None', 'Huge grey beast with tusks and trunk.'],
        ['Frog, Giant', 'Animal', 'S', 7, '3, Sw 9', '2', 1, '1d6', 35, '6', 'Neutral', 'Common', 'Tongue: +4 to hit, pulls prey; swallows small creatures', 'None', 'Swamp frog big enough to swallow a halfling.'],
        ['Horse, Heavy War', 'Animal', 'L', 7, '15', '3+3', 3, '1d8/1d8/1d3', 175, '9', 'Neutral', 'Uncommon', 'Trained to fight with its rider', 'None', 'Massive, armored charger bred for knights.'],
        ['Leech, Giant', 'Animal', 'S', 9, '3, Sw 3', '2', 1, '1d4', 65, '8', 'Neutral', 'Common', 'Drains blood 1 HP per HD per round; 50% unnoticed; disease 50%', 'None', 'Slimy swamp leech several feet long.'],
        ['Leopard', 'Animal', 'M', 6, '15', '3+2', 3, '1d3/1d3/1d6', 175, '9', 'Neutral', 'Uncommon', 'Rake 1d4/1d4 if both claws hit; surprise on 1-3', 'None', 'Spotted big cat that hunts from trees.'],
        ['Lion', 'Animal', 'L', 6, '12', '5+2', 3, '1d4/1d4/1d10', 420, '9', 'Neutral', 'Common', 'Rake 2d4/2d4 if both front claws hit', 'None', 'Proud big cat of the savannah, hunting in prides.'],
        ['Lizard, Giant', 'Animal', 'L', 5, '6, Sw 12', '3+1', 1, '1d8', 65, '7', 'Neutral', 'Common', 'Double damage bite on a natural 20', 'None', 'Swamp lizard as long as a horse.'],
        ['Rat, Giant', 'Animal', 'T', 7, '12, Sw 6', '1/2', 1, '1d3', 15, '5', 'Neutral (evil)', 'Common', '5% chance per bite of serious disease', 'None', 'Dog-sized rats that infest sewers and dungeons.'],
        ['Scorpion, Giant', 'Animal', 'M', 3, '15', '5+5', 3, '1d10/1d10/1d4', 975, '11', 'Neutral', 'Uncommon', 'Sting: save vs poison or die', 'None', 'Black scorpion the size of a pony.'],
        ['Snake, Constrictor', 'Animal', 'M', 6, '9', '3+2', 2, '1/2d4', 175, '8', 'Neutral', 'Common', 'Constricts 2d4 per round after a hit', 'None', 'Large python that crushes its prey.'],
        ['Snake, Giant Constrictor', 'Animal', 'L', 5, '9', '6+1', 2, '1d4/2d4', 650, '9', 'Neutral', 'Uncommon', 'Constricts 2d4 per round; needs 60 STR points total to free a victim', 'None', 'Thirty-foot jungle snake.'],
        ['Snake, Poisonous', 'Animal', 'S', 6, '15', '2+1', 1, '1', 175, '8', 'Neutral', 'Common', 'Poison: save vs poison or 3d6 damage (or death, by species)', 'None', 'Venomous snake such as a viper or cobra.'],
        ['Spider, Large', 'Animal', 'S', 8, '6, Wb 15', '1+1', 1, '1', 175, '7', 'Neutral', 'Common', 'Poison type A (15 damage, save for none); webs', 'None', 'Cat-sized hunting spider.'],
        ['Spider, Huge', 'Animal', 'M', 6, '18', '2+2', 1, '1d6', 270, '8', 'Neutral', 'Common', 'Poison type A (save +1); leaps 30 ft; surprise on 1-5', 'None', 'Dog-sized hunting spider that pounces on prey.'],
        ['Spider, Giant', 'Animal', 'L', 4, '3, Wb 12', '4+4', 1, '2d4', 650, '13', 'Chaotic evil', 'Uncommon', 'Poison type F (save or die); strong webs', 'None', 'Huge web-spinning spider that lairs in forests and dungeons.'],
        ['Tiger', 'Animal', 'L', 6, '12', '5+5', 3, '2d4/2d4/1d10', 650, '10', 'Neutral', 'Uncommon', 'Rake 2d4/2d4 if both front claws hit; surprise on 1-3', 'None', 'Striped great cat, a solitary hunter.'],
        ['Toad, Giant', 'Animal', 'M', 6, '6, hop 6', '2+4', 1, '2d4', 65, '6', 'Neutral', 'Common', 'Leaps up to 60 ft', 'None', 'Warty toad as big as a dog.'],
        ['Wasp, Giant', 'Animal', 'S', 4, '6, Fl 21', '4', 2, '2d4/1d4', 420, '10', 'Neutral', 'Rare', 'Sting: save vs poison or paralyzed 2d4 days', 'Wings burn easily', 'Wasp the size of a large hawk that stocks its nest with paralyzed prey.'],
        ['Weasel, Giant', 'Animal', 'M', 6, '15', '3+3', 1, '2d6', 175, '8', 'Neutral', 'Uncommon', 'Holds on and drains blood 2d6 per round', 'None', 'Long, fierce predator with valuable fur.'],
        ['Wolf', 'Animal', 'S', 7, '18', '2+2', 1, '1d4+1', 120, '10', 'Neutral', 'Common', 'Hunts in packs', 'None', 'Grey wolves that hunt in packs of 2-12.'],
        ['Wolf, Dire', 'Animal', 'M', 6, '18', '4+4', 1, '2d4', 175, '11', 'Neutral', 'Uncommon', 'Hunts in packs; sometimes ridden by goblins', 'None', 'Prehistoric wolf as big as a pony.'],
        ['Wolverine', 'Animal', 'S', 5, '12', '3', 3, '1d4/1d4/2d4', 120, '10', 'Neutral', 'Uncommon', 'Musk (sickens, -1 to hit); +4 to hit in rage', 'None', 'Small but ferocious animal that fears nothing.'],

        // ---------- Humanoids ----------
        ['Duergar', 'Humanoid', 'S', 4, '6', '1+2', 1, '1d8 (weapon)', 175, '12', 'Lawful evil', 'Uncommon', 'Enlarge and invisibility once per day; surprise on 1-3', 'Paralysis, poison, illusions; +4 saves vs magic', 'Grey, bald, sour dwarves of the Underdark.'],
        ['Flind', 'Humanoid', 'L', 5, '12', '2+3', 1, '1d6 (flindbar)', 120, '12', 'Lawful evil', 'Rare', 'Flindbar: may disarm on a hit (save vs paralyzation)', 'None', 'Stronger, smarter cousin of the gnoll.'],
        ['Grimlock', 'Humanoid', 'M', 5, '12', '2', 1, '1d6 (weapon)', 35, '10', 'Neutral evil', 'Rare', 'Blind; immune to sight-based illusions and gaze; keen hearing and smell', 'Sight-based effects', 'Grey-skinned, eyeless humanoids of the deep caves.'],
        ['Kenku', 'Humanoid', 'M', 5, '6, Fl 18', '2', 3, '1d4/1d4/1d6', 175, '12', 'Neutral', 'Rare', 'Mimic voices; some cast magic missile, invisibility', 'None', 'Crow-headed thieves with feathered arms.'],
        ['Kuo-toa', 'Humanoid', 'M', 4, '9, Sw 18', '2', 2, '1d4 + weapon', 120, '13', 'Neutral evil', 'Rare', 'Sticky shield; lightning from priests; never surprised', 'Poison, paralysis; half damage from electricity', 'Fish-men of the Underdark who worship a mad goddess.'],
        ['Merman', 'Humanoid', 'M', 7, '1, Sw 18', '1+1', 1, '1d6 (weapon)', 35, '13', 'Neutral', 'Uncommon', 'Fights with trident and net', 'None', 'Sea folk, human above the waist and fish below.'],
        ['Ogrillon', 'Humanoid', 'M', 6, '12', '2', 2, '1d6/1d6', 65, '12', 'Chaotic evil', 'Rare', 'Fists studded with armor plates', 'None', 'Half-ogre, half-orc brute that fights with its fists.'],
        ['Orog', 'Humanoid', 'M', 3, '9', '3', 1, '1d8 (weapon)', 120, '12', 'Lawful evil', 'Rare', 'Elite orcs; no sunlight penalty', 'None', 'Large, disciplined orcs that serve as elite guards.'],
        ['Sahuagin', 'Humanoid', 'M', 5, '12, Sw 24', '2+2', 1, '1d6 (weapon)', 175, '12', 'Lawful evil', 'Uncommon', 'Unarmed: 1d2/1d2/1d4/1d4/1d4; blood frenzy', 'None', 'Shark-like sea devils that raid coastal towns.'],
        ['Svirfneblin', 'Humanoid', 'S', 2, '9', '3+6', 1, '1d6 (weapon)', 420, '12', 'Neutral', 'Rare', 'Blindness, blur, change self 1/day; summon earth elemental; surprise on 1-9 (d10)', 'Illusions; +2 saves', 'Deep gnomes who mine gems in the Underdark.'],
        ['Troglodyte', 'Humanoid', 'M', 5, '12', '2', 3, '1d2/1d2/1d4+1', 120, '11', 'Chaotic evil', 'Uncommon', 'Stench: save vs poison or lose 1d6 STR for 10 rounds; chameleon skin', 'None', 'Smelly reptilian cave raiders.'],
        ['Derro', 'Humanoid', 'S', 4, '9', '3', 1, '1d8 (weapon)', 270, '12', 'Chaotic evil', 'Rare', 'Savants cast spells; poison darts; repeating crossbow', 'None', 'Insane, cruel dwarf-kin of the deep caves.'],
        ['Fomorian', 'Giant', 'H', 3, '9', '13+3', 1, '4d8 (weapon)', 4000, '14', 'Neutral evil', 'Rare', 'Twisted body; surprised only on a 1', 'None', 'Deformed, hateful giants of the underground.'],
        ['Verbeeg', 'Giant', 'L', 4, '18', '5+5', 1, '1d6+1d4 (weapon)', 420, '13', 'Neutral', 'Rare', 'Throw spears or rocks 2d6', 'None', 'Tall, lean giant-kin, cunning and greedy.'],
        ['Troll, Two-headed', 'Giant', 'L', 4, '12', '10', 4, '1d6/1d6/1d10/1d10', 3000, '14', 'Chaotic evil', 'Rare', 'Regenerates 1 HP per round; surprised only on a 1', 'None', 'A troll with two arguing heads.'],
        ['Troll, Ice', 'Giant', 'L', 8, '9, Sw 12', '2', 2, '1d8/1d8', 175, '13', 'Chaotic evil', 'Rare', 'Regenerates 2 HP per round (in water or ice)', 'Cold', 'Smaller pale troll of frozen lands.'],

        // ---------- Undead ----------
        ['Banshee (Groaning Spirit)', 'Undead', 'M', 0, '15', '7', 1, '1d8', 3000, '15', 'Chaotic evil', 'Very Rare', 'Keen: all within 30 ft save vs magic or die (once a night); fear', 'Hit only by +1 weapons; 50% magic resistance; sleep, charm, hold, cold, electricity', 'Ghost of an evil elf woman whose wail kills.'],
        ['Coffer Corpse', 'Undead', 'M', 8, '6', '2', 1, '1d6', 175, '20', 'Chaotic evil', 'Rare', 'Strangles; seems to die, then rises again (fear)', 'Hit only by magic weapons', 'Undead whose body was never laid to rest.'],
        ['Crypt Thing', 'Undead', 'M', 3, '12', '6', 1, '1d8', 975, '14', 'Neutral', 'Very Rare', 'Teleports all who fail a save vs magic away from the crypt', 'Hit only by magic weapons; sleep, charm, hold', 'Skeletal guardian of tombs.'],
        ['Death Knight', 'Undead', 'M', 0, '12', '9 (d10)', 1, '1d10+3 (weapon)', 8000, '17', 'Chaotic evil', 'Very Rare', 'Fireball 20 dice 1/day, power word kill, fear; command undead', '75% magic resistance; sleep, charm, hold', 'Fallen paladin bound in undeath.'],
        ['Ghoul, Lacedon', 'Undead', 'M', 6, '9, Sw 9', '2', 3, '1d3/1d3/1d6', 65, '12', 'Chaotic evil', 'Uncommon', 'Paralyzing touch (not elves)', 'Sleep, charm', 'Aquatic ghouls that haunt shipwrecks.'],
        ['Heucuva', 'Undead', 'M', 3, '9', '2', 1, '1d6', 120, '12', 'Chaotic evil', 'Rare', 'Touch causes disease (save vs poison)', 'Silver or magic weapons only; sleep, charm, hold', 'Skeleton of a fallen monk in rotting robes.'],
        ['Poltergeist', 'Undead', 'S', 10, '6', '1/2', 1, 'thrown objects', 120, '12', 'Lawful evil', 'Uncommon', 'Throws objects; fear (save vs spell or flee)', 'Invisible; silver or magic weapons', 'Restless invisible spirit that hurls things about.'],
        ['Revenant', 'Undead', 'M', 10, '9', '8', 1, '2d8', 1400, '20', 'Neutral', 'Very Rare', 'Paralyzing gaze vs its killer; regenerates 3 HP/round; only fire stops it', 'Acid, gas, sleep, charm, hold', 'Corpse risen to take revenge on its murderer.'],
        ['Skeleton, Monster', 'Undead', 'L', 6, '12', '6', 1, '1d12', 650, '20', 'Neutral', 'Rare', 'Half damage from edged/piercing weapons', 'Sleep, charm, hold, cold', 'Animated bones of a large monster.'],
        ['Skeleton Warrior', 'Undead', 'M', 2, '6', '9+2-12', 1, '1d8+3 (weapon)', 5000, '19', 'Neutral evil', 'Very Rare', 'Controlled by whoever holds its circlet; fear in low-level foes', '90% magic resistance; turned as special', 'Undead lord bound to a golden circlet.'],
        ['Sons of Kyuss', 'Undead', 'M', 10, '9', '4', 1, '1d8', 420, '13', 'Chaotic evil', 'Very Rare', 'Fear aura; worms burrow to the brain (cure disease or die)', 'Sleep, charm, hold', 'Zombie-like servants crawling with green worms.'],
        ['Zombie, Juju', 'Undead', 'M', 6, '9', '3+12', 1, '3d4', 975, '20', 'Neutral evil', 'Rare', 'Climbs walls; hits as a 6 HD monster', 'Edged/piercing do half; immune to sleep, charm, hold, electricity, magic missile', 'Grey, hard-skinned zombie made by an evil spell.'],
        ['Zombie, Monster', 'Undead', 'L', 6, '9', '6', 1, '4d4', 270, '20', 'Neutral', 'Rare', 'Always strikes last', 'Sleep, charm, hold, cold, poison', 'Animated corpse of an ogre or giant.'],

        // ---------- Oozes, slimes, molds, ambushers ----------
        ['Gelatinous Cube', 'Ooze', 'L', 8, '6', '4', 1, '2d4', 650, '10', 'Neutral', 'Uncommon', 'Paralysis 5d4 rounds (save vs paralysis); nearly invisible, surprise on 1-3', 'Electricity, fear, holds, paralysis, polymorph, sleep', 'Transparent cube that cleans dungeon corridors of everything organic.'],
        ['Ochre Jelly', 'Ooze', 'M', 8, '3', '6', 1, '3d4', 270, '10', 'Neutral', 'Uncommon', 'Dissolves organic matter; lightning divides it', 'Electricity divides it', 'Yellow-brown amoeba that seeps through cracks.'],
        ['Mold, Yellow', 'Plant', 'S', 9, '0', '-', 0, '1d6 + spores', 65, '-', 'Neutral', 'Common', 'Spores when touched: save vs poison or die (or 1d6, DM). Fire destroys it', 'All but fire', 'Patch of yellow fungus that bursts into deadly spores.'],
        ['Mold, Brown', 'Plant', 'S', 9, '0', '-', 0, '4d8 cold', 15, '-', 'Neutral', 'Rare', 'Drains heat from anyone within 5 ft; grows from fire', 'Fire makes it grow', 'Brown fungus that feeds on warmth.'],
        ['Rot Grub', 'Animal', 'T', 9, '1', '1 hp', 0, 'special', 15, '5', 'Neutral', 'Uncommon', 'Burrows to the heart in 1d3 turns unless fire or cure disease', 'None', 'Tiny white grubs found in carrion and offal.'],
        ['Shrieker', 'Plant', 'S', 7, '1', '3', 0, 'nil', 35, '12', 'Neutral', 'Common', 'Shrieks when light or movement is near, drawing monsters', 'None', 'Large fungus that screams at intruders.'],
        ['Violet Fungus', 'Plant', 'S', 7, '1', '3', 2, 'rot (special)', 175, '12', 'Neutral', 'Rare', 'Touch rots flesh: save vs poison or flesh rots (cure disease)', 'None', 'Purple fungus with long branch-like arms.'],
        ['Piercer', 'Monster', 'S', 3, '1', '1-4', 1, '1d6 per HD', 175, '13', 'Neutral', 'Common', 'Drops from the ceiling: surprise on 1-5 (d6)', 'None', 'Stalactite-like creature that falls on prey.'],
        ['Lurker Above', 'Monster', 'H', 6, '1, Fl 9', '10', 1, '1d6 + smother', 4000, '14', 'Neutral', 'Very Rare', 'Drops and wraps victims: smother in 1d4+1 rounds', 'None', 'Flat creature that looks like a cave ceiling.'],
        ['Trapper', 'Monster', 'G', 3, '3', '12', 1, '4 + victim AC', 5000, '15', 'Neutral', 'Very Rare', 'Looks like the floor; closes over victims, smother in 6 rounds', 'Cold and fire do half', 'Floor-mimicking predator of dungeons.'],
        ['Mimic', 'Monster', 'L', 7, '3', '7-10', 1, '3d4', 975, '14', 'Neutral', 'Rare', 'Disguised as a chest or door; glue holds victims', 'Acid', 'Shapeshifter that pretends to be furniture or treasure.'],
        ['Roper', 'Monster', 'L', 0, '3', '10-12', 1, '5d4', 6000, '18', 'Chaotic evil', 'Rare', '6 strands (20-50 ft) cause weakness (lose half STR); pulls victims to its maw', '80% magic resistance; electricity; half cold', 'Stalagmite-like predator with sticky strands.'],
        ['Darkmantle', 'Monster', 'S', 6, '3, Fl 15', '1+2', 1, '1d4', 175, '9', 'Neutral', 'Rare', 'Darkness 15 ft radius; drops and smothers', 'None', 'Cave creature that looks like a stalactite and drops on prey.'],
        ['Cloaker', 'Monster', 'L', 3, '1, Fl 15', '6', 3, '1d6/1d6/1d4', 1400, '14', 'Chaotic neutral', 'Rare', 'Wraps a victim; moans cause fear, nausea or hold', 'None', 'Manta-like creature that looks like a black cloak.'],
        ['Grell', 'Monster', 'M', 5, '1, Fl 12', '5', 11, '1d4 x10 / 1d6', 650, '12', 'Neutral evil', 'Rare', 'Tentacles paralyze (save vs paralysis)', 'Electricity', 'Floating brain with a beak and ten tentacles.'],
        ['Hook Horror', 'Monster', 'L', 3, '9', '5', 3, '1d8/1d8/2d6', 270, '13', 'Neutral', 'Rare', 'Hooks hold victims for an automatic bite', 'None', 'Vulture-headed beast with hooked arms, found in the Underdark.'],
        ['Carrion Crawler, Giant', 'Monster', 'L', 3, '12', '3+1', 8, 'paralysis / 1d2', 420, '13', 'Neutral', 'Uncommon', '8 tentacles paralyze for 2d6 turns', 'None', 'Giant worm-like scavenger.'],

        // ---------- Magical beasts & monsters ----------
        ['Behir', 'Monster', 'G', 4, '15', '12', 2, '2d4/1d4+1 constrict', 10000, '15', 'Neutral evil', 'Rare', 'Lightning bolt 24 HP every 10 rounds; swallow on 20; climb', 'Electricity, poison', 'Twelve-legged blue reptile that breathes lightning.'],
        ['Catoblepas', 'Monster', 'L', 7, '6', '6+2', 1, '1d6 + stun', 2000, '10', 'Neutral', 'Very Rare', 'Death gaze (save vs death magic, 60 ft)', 'None', 'Ugly swamp beast whose gaze kills.'],
        ['Dragonne', 'Monster', 'L', 6, '15, Fl 9', '9', 3, '1d8/1d8/3d6', 2000, '15', 'Neutral', 'Rare', 'Roar: weakness (lose 50% STR) and deafness within 120 ft', 'None', 'Brass-dragon and lion hybrid with a terrible roar.'],
        ['Lamia', 'Monster', 'L', 3, '24', '9', 1, '1d4 (weapon)', 2000, '13', 'Chaotic evil', 'Very Rare', 'Touch drains 1 WIS; charm person, mirror image, illusions, suggestion', 'None', 'Desert creature with a woman\'s torso and a lion\'s body.'],
        ['Lammasu', 'Monster', 'L', 6, '12, Fl 24', '7+7', 2, '1d6/1d6', 2000, '15', 'Lawful good', 'Rare', 'Protection from evil 10 ft; priest spells; invisibility, dimension door', '30% magic resistance', 'Winged lion with a human head, champion of good.'],
        ['Peryton', 'Monster', 'M', 7, '12, Fl 21', '4', 1, '4d4', 270, '13', 'Chaotic evil', 'Rare', '+2 to hit; tears out its victim\'s heart', '+1 weapons to hit', 'Stag-headed bird whose shadow is that of a man.'],
        ['Barghest', 'Monster', 'M', 2, '15', '6', 1, '2d4', 2000, '15', 'Lawful evil', 'Very Rare', 'Shape change goblin/wolf; levitate, charm, dimension door', '+1 weapons to hit', 'Fiendish goblin-wolf that grows by eating souls.'],
        ['Hound, Yeth', 'Monster', 'M', 0, 'Fl 27', '3+3', 1, '2d4', 420, '14', 'Neutral evil', 'Rare', 'Baying causes fear (save vs spell)', 'Silver or magic weapons', 'Black hunting hound of the night sky.'],
        ['Kraken', 'Monster', 'G', 5, 'Sw 21', '20', 3, '2d4 x2 / 5d4', 14000, '17', 'Neutral evil', 'Very Rare', 'Grasping arms 3d6 constrict; ink cloud; spells', 'None', 'Giant intelligent squid of the deep ocean.'],

        // ---------- Golems & constructs ----------
        ['Golem, Flesh', 'Construct', 'L', 9, '8', '9 (40 HP)', 2, '2d8/2d8', 2000, '20', 'Neutral', 'Rare', 'Electricity heals it; fire and cold slow it; may go berserk', 'Hit only by magic weapons; all spells but fire, cold, electricity', 'Stitched-together body animated by magic.'],
        ['Golem, Clay', 'Construct', 'L', 7, '7', '11 (50 HP)', 1, '3d10', 4000, '20', 'Neutral', 'Rare', 'Wounds heal only with heal spell; haste 1/day', 'Blunt magic weapons only; most spells', 'Clay statue that guards temples.'],
        ['Golem, Stone', 'Construct', 'L', 5, '6', '14 (60 HP)', 1, '3d8', 8000, '20', 'Neutral', 'Rare', 'Slow spell every other round (10 ft)', '+2 weapons to hit; most spells', 'Massive stone statue that walks.'],
        ['Golem, Iron', 'Construct', 'L', 3, '6', '18 (80 HP)', 1, '4d10', 13000, '20', 'Neutral', 'Very Rare', 'Poison gas cloud every 7 rounds; fire heals it; rusts', '+3 weapons to hit; most spells', 'Twelve-foot iron giant, nearly unstoppable.'],

        // ---------- Elementals & planar ----------
        ['Elemental, Air', 'Elemental', 'L', 2, 'Fl 36', '16', 1, '2d10', 10000, '17', 'Neutral', 'Rare', 'Whirlwind kills creatures under 3 HD; +1 to hit flyers, +2 damage', '+2 weapons to hit', 'Swirling living wind (8, 12 or 16 HD by how it was summoned).'],
        ['Elemental, Earth', 'Elemental', 'L', 2, '6', '16', 1, '4d8', 10000, '17', 'Neutral', 'Rare', 'Smash structures; -2 damage vs airborne or water creatures', '+2 weapons to hit', 'Moving mass of rock and soil.'],
        ['Elemental, Fire', 'Elemental', 'L', 2, '12', '16', 1, '3d8', 10000, '17', 'Neutral', 'Rare', 'Sets things on fire; cannot cross water', '+2 weapons to hit; fire', 'Living pillar of flame.'],
        ['Elemental, Water', 'Elemental', 'L', 2, '6, Sw 18', '16', 1, '5d6', 10000, '17', 'Neutral', 'Rare', 'Overturns boats; must stay within 60 yards of water', '+2 weapons to hit', 'Surging wave in roughly human shape.'],
        ['Djinni', 'Planar', 'L', 4, '9, Fl 24', '7+3', 1, '2d8', 3000, '13', 'Chaotic good', 'Very Rare', 'Whirlwind; invisibility, create food, illusion; grants 1 wish when bound (noble djinn)', 'None', 'Air genie, proud and quick to anger.'],
        ['Imp', 'Planar', 'T', 2, '6, Fl 18', '2+2', 1, '1d4', 1400, '9', 'Lawful evil', 'Very Rare', 'Poison tail (save vs poison or die); polymorph, invisibility, regenerate 1 HP/round', 'Silver or magic weapons; 25% magic resistance; fire, cold, electricity', 'Tiny devil that serves evil wizards as a familiar.'],
        ['Quasit', 'Planar', 'T', 2, '15', '3', 3, '1d2/1d2/1d4', 2000, '9', 'Chaotic evil', 'Very Rare', 'Claws: lose 1 DEX for 2d6 rounds; invisibility, polymorph, fear', 'Cold-iron or magic weapons; 25% magic resistance', 'Tiny demon familiar of chaotic wizards.'],
        ['Mephit, Fire', 'Planar', 'S', 5, '12, Fl 24', '3+1', 2, '1d3+1 / 1d3+1', 975, '11', 'Lawful evil', 'Rare', 'Breath fire 1d8+1; magic missile, heat metal', 'Fire', 'Small fiery imp of the Elemental Plane of Fire.'],

        // ---------- Hags & fey ----------
        ['Hag, Annis', 'Monster', 'L', 0, '15', '7+7', 3, '1d8+8/1d8+8/2d4+8', 2000, '15', 'Chaotic evil', 'Rare', 'Grab and squeeze (automatic hits); fog cloud 3/day', '20% magic resistance', 'Huge blue-skinned hag with iron nails.'],
        ['Hag, Green', 'Monster', 'M', -2, '12, Sw 12', '9', 2, '1d2+6/1d2+6', 4000, '14', 'Neutral evil', 'Rare', 'Mimic voices; audible glamer, invisibility, pass without trace', '35% magic resistance', 'Swamp hag who lures travelers to their deaths.'],
        ['Hag, Sea', 'Monster', 'M', 7, '15, Sw 15', '3', 1, '1d4 (weapon)', 1400, '13', 'Chaotic evil', 'Uncommon', 'Seeing her: save vs spell or lose 1d6 STR; death gaze 3/day', '50% magic resistance', 'Hideous sea witch.'],
        ['Brownie', 'Faerie', 'T', 3, '12', '1/2', 1, '1d3 (weapon)', 120, '8', 'Lawful good', 'Rare', 'Protection from evil, ventriloquism, dancing lights, mirror image 1/day; surprise on 1-5', 'None', 'Tiny shy house-helper.'],
        ['Nixie', 'Faerie', 'S', 7, '6, Sw 12', '1/2', 1, '1d4 (weapon)', 175, '6', 'Neutral', 'Rare', 'Charm person (10 together); water breathing to charmed captives', '25% magic resistance', 'Water sprites who enslave travelers for a year.'],
        ['Pixie', 'Faerie', 'S', 5, '6, Fl 12', '1/2', 1, '1d4 (weapon)', 650, '8', 'Neutral', 'Rare', 'Invisible; arrows cause sleep or forgetfulness; polymorph self', '25% magic resistance', 'Tiny mischievous winged fairies.']
    ];

    // Same rules as the Bestiary (js/enemies.js): THAC0 and saves from Hit Dice
    function parseHDx(s) {
        s = String(s);
        if (/^1\/2|hp/.test(s) || s === '-') return { n: 0, plus: 0 };
        const m = s.match(/^(\d+)\s*([+-]\s*\d+)?/);
        return m ? { n: parseInt(m[1]), plus: m[2] ? parseInt(m[2].replace(/\s/g, '')) : 0 } : { n: 1, plus: 0 };
    }
    function thac0For(h) { const e = h.n < 1 || (h.n === 1 && h.plus < 0) ? 0 : h.n + (h.plus >= 3 ? 1 : 0); return e === 0 ? 20 : Math.max(1, 19 - 2 * Math.floor((e - 1) / 2)); }
    const WARRIOR_SAVES = [[0, '16/18/17/20/19'], [2, '14/16/15/17/17'], [4, '13/15/14/16/16'], [6, '11/13/12/13/14'], [8, '10/12/11/12/13'],
        [10, '8/10/9/9/11'], [12, '7/9/8/8/10'], [14, '5/7/6/5/8'], [16, '4/6/5/4/7'], [99, '3/5/4/4/6']];
    function savesFor(h) { const e = h.n < 1 ? 0 : h.n + (h.plus >= 3 ? 1 : 0); return WARRIOR_SAVES.find(r => e <= r[0])[1]; }
    const ENCOUNTER = { 'Common': '15%', 'Uncommon': '8%', 'Rare': '3%', 'Very Rare': '1%' };

    if (typeof DB === 'undefined' || !DB.monsters) return;
    ROWS.forEach(r => {
        const [name, category, size, ac, move, hd, attacks, damage, xp, morale, alignment, frequency, special, immunities, appearance] = r;
        if (DB.monsters[name]) return;   // keep the original entry
        const h = parseHDx(hd);
        DB.monsters[name] = {
            category, size, ac, hd: String(hd), thac0: thac0For(h), damage, xp, source: 'Monstrous Manual (summary)',
            saves: savesFor(h), immunities: immunities || 'None', special: special || '', appearance, frequency,
            encounter: ENCOUNTER[frequency] || '5%', move, attacks, morale, alignment
        };
    });
})();

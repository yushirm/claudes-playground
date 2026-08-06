// Room 02 — the tree.
//
// Hand-authored. Every continuation and every weight in this file was written
// by me, chosen to show the shape of a branching distribution. None of it was
// sampled from a model and none of it was measured. The room says so out loud.
//
// Structure: each seed names a root node. A node is a list of continuations,
// each with a weight and a pointer to the next node — or `null`, which ends the
// sentence. Weights within a node are relative and need not sum to anything;
// the room normalises them.
//
// The weights are deliberately uneven from node to node. Some steps have one
// obvious continuation and three long shots; some are a genuine four-way toss.
// That unevenness is the most truthful thing in the file.

export default {
  seeds: [
    {
      id: 'letter',
      label: 'a letter',
      text: 'The letter arrived on a Tuesday, and',
      root: 'letter',
    },
    {
      id: 'experiment',
      label: 'an experiment',
      text: 'The experiment worked, which meant',
      root: 'experiment',
    },
    {
      id: 'explain',
      label: 'a promise',
      text: 'She said she would explain everything, but',
      root: 'explain',
    },
    {
      id: 'river',
      label: 'a city',
      text: 'The city had one rule about the river:',
      root: 'river',
    },
    {
      id: 'list',
      label: 'a list',
      text: 'He kept a list of things he had never',
      root: 'list',
    },
    {
      id: 'counting',
      label: 'a machine',
      text: 'By the time the machine finished counting,',
      root: 'counting',
    },
  ],

  nodes: {
    /* ---------------------------------------------------------------- letter */
    letter: [
      { t: ' nobody opened it for', w: 40, to: 'letter.wait' },
      { t: ' she knew the handwriting', w: 26, to: 'letter.hand' },
      { t: ' it was addressed to a man', w: 20, to: 'letter.wrong' },
      { t: ' the return address was', w: 14, to: 'letter.from' },
    ],
    'letter.wait': [
      { t: ' eleven days,', w: 47, to: 'letter.wait.a' },
      { t: ' most of a winter,', w: 33, to: 'letter.wait.b' },
      { t: ' long enough that', w: 20, to: 'letter.wait.c' },
    ],
    'letter.wait.a': [
      { t: ' which was not deliberate, exactly.', w: 44, to: null },
      { t: ' and then all four of them read it at once.', w: 33, to: null },
      { t: ' by which point the offer inside had expired.', w: 23, to: null },
    ],
    'letter.wait.b': [
      { t: ' propped against the sugar tin where everyone could see it.', w: 46, to: null },
      { t: ' and the house arranged itself quietly around not mentioning it.', w: 32, to: null },
      { t: ' though the postmark said it had been urgent.', w: 22, to: null },
    ],
    'letter.wait.c': [
      { t: ' the news inside had already happened without them.', w: 45, to: null },
      { t: ' opening it would have been an admission of something.', w: 31, to: null },
      { t: ' the envelope had gone soft at the corners.', w: 24, to: null },
    ],
    'letter.hand': [
      { t: ' and put it in a drawer', w: 42, to: 'letter.hand.a' },
      { t: ' before she had read a word', w: 35, to: 'letter.hand.b' },
      { t: ' though the man who wrote it', w: 23, to: 'letter.hand.c' },
    ],
    'letter.hand.a': [
      { t: ' with the others, which had also not been opened.', w: 48, to: null },
      { t: ' and went to work and did not think about it once.', w: 30, to: null },
      { t: ' where it stayed until the house was sold.', w: 22, to: null },
    ],
    'letter.hand.b': [
      { t: ', and that was the whole of the information.', w: 43, to: null },
      { t: ', which told her more than the letter would have.', w: 36, to: null },
      { t: ' of it, and sat down on the stairs.', w: 21, to: null },
    ],
    'letter.hand.c': [
      { t: ' had been dead for six years.', w: 51, to: null },
      { t: ' had never once written to her before.', w: 28, to: null },
      { t: ' was standing at the end of the drive.', w: 21, to: null },
    ],
    'letter.wrong': [
      { t: ' who had moved out in', w: 44, to: 'letter.wrong.a' },
      { t: ' with her surname and', w: 34, to: 'letter.wrong.b' },
      { t: ' she had never heard of,', w: 22, to: 'letter.wrong.c' },
    ],
    'letter.wrong.a': [
      { t: ' 1994 and left no forwarding address.', w: 46, to: null },
      { t: ' the spring, owing three months of rent.', w: 31, to: null },
      { t: ' a hurry, and had taken the door handles with him.', w: 23, to: null },
    ],
    'letter.wrong.b': [
      { t: ' none of her history.', w: 49, to: null },
      { t: ' a first initial she did not recognise.', w: 30, to: null },
      { t: ' her father’s job, in her father’s hand.', w: 21, to: null },
    ],
    'letter.wrong.c': [
      { t: ' which was the interesting part.', w: 41, to: null },
      { t: ' and whose bank apparently thought otherwise.', w: 34, to: null },
      { t: ' though the flat had only ever had one tenant.', w: 25, to: null },
    ],
    'letter.from': [
      { t: ' a building that', w: 43, to: 'letter.from.a' },
      { t: ' her own,', w: 33, to: 'letter.from.b' },
      { t: ' printed rather than written,', w: 24, to: 'letter.from.c' },
    ],
    'letter.from.a': [
      { t: ' had been demolished the year before.', w: 47, to: null },
      { t: ' she had walked past every day for a decade.', w: 31, to: null },
      { t: ' does not appear on any map she can find.', w: 22, to: null },
    ],
    'letter.from.b': [
      { t: ' in a hand that was almost hers.', w: 45, to: null },
      { t: ' which she read twice and then a third time.', w: 33, to: null },
      { t: ' from eleven years and two countries ago.', w: 22, to: null },
    ],
    'letter.from.c': [
      { t: ' which meant an office, which meant a decision had been taken.', w: 48, to: null },
      { t: ' and slightly crooked, as if done in a hurry.', w: 29, to: null },
      { t: ' with a reference number where a name should go.', w: 23, to: null },
    ],

    /* ------------------------------------------------------------ experiment */
    experiment: [
      { t: ' the theory was wrong.', w: 36, to: 'experiment.wrong' },
      { t: ' someone would have to', w: 30, to: 'experiment.tell' },
      { t: ' it could be done again by', w: 21, to: 'experiment.again' },
      { t: ' nothing after that would be', w: 13, to: 'experiment.after' },
    ],
    'experiment.wrong': [
      { t: ' Not slightly wrong —', w: 45, to: 'experiment.wrong.a' },
      { t: ' Everyone in the room understood this', w: 34, to: 'experiment.wrong.b' },
      { t: ' It had been wrong', w: 21, to: 'experiment.wrong.c' },
    ],
    'experiment.wrong.a': [
      { t: ' wrong in the direction that costs people their careers.', w: 44, to: null },
      { t: ' wrong the way a map is wrong when the river has moved.', w: 34, to: null },
      { t: ' wrong at the first line, which nobody had checked in years.', w: 22, to: null },
    ],
    'experiment.wrong.b': [
      { t: ' at the same moment, and nobody said it out loud.', w: 47, to: null },
      { t: ' except the one person whose theory it was.', w: 32, to: null },
      { t: ' and went on writing as though they did not.', w: 21, to: null },
    ],
    'experiment.wrong.c': [
      { t: ' for eleven years, in print, in every textbook.', w: 46, to: null },
      { t: ' in a way that had been useful, which is worse.', w: 33, to: null },
      { t: ' from the start, and had still predicted the right answer twice.', w: 21, to: null },
    ],
    'experiment.tell': [
      { t: ' tell the funder,', w: 42, to: 'experiment.tell.a' },
      { t: ' repeat it before Thursday,', w: 33, to: 'experiment.tell.b' },
      { t: ' decide what counted as the result,', w: 25, to: 'experiment.tell.c' },
    ],
    'experiment.tell.a': [
      { t: ' who had paid for the opposite outcome.', w: 48, to: null },
      { t: ' and the phrasing of that would take a week.', w: 30, to: null },
      { t: ' though nobody could agree who that was any more.', w: 22, to: null },
    ],
    'experiment.tell.b': [
      { t: ' with the same apparatus and the same weather.', w: 44, to: null },
      { t: ' which nobody in the group believed was possible.', w: 34, to: null },
      { t: ' and it did not work the second time.', w: 22, to: null },
    ],
    'experiment.tell.c': [
      { t: ' and that turned out to be the whole argument.', w: 46, to: null },
      { t: ' before the graduate students published it themselves.', w: 31, to: null },
      { t: ' which is a question about people, not about the world.', w: 23, to: null },
    ],
    'experiment.again': [
      { t: ' anyone with', w: 46, to: 'experiment.again.a' },
      { t: ' this time next year,', w: 32, to: 'experiment.again.b' },
      { t: ' nobody, ever,', w: 22, to: 'experiment.again.c' },
    ],
    'experiment.again.a': [
      { t: ' four hundred pounds and a cold room.', w: 45, to: null },
      { t: ' the patience to wait eight months for one number.', w: 33, to: null },
      { t: ' access to a sample nobody would ever grant again.', w: 22, to: null },
    ],
    'experiment.again.b': [
      { t: ' assuming the funding and the freezer both held.', w: 47, to: null },
      { t: ' by which point it would matter to nobody.', w: 30, to: null },
      { t: ' in three labs at once, which was the point.', w: 23, to: null },
    ],
    'experiment.again.c': [
      { t: ' because the material no longer exists.', w: 49, to: null },
      { t: ' since the only person who could run it had retired.', w: 29, to: null },
      { t: ' which made it a fact and not a finding.', w: 22, to: null },
    ],
    'experiment.after': [
      { t: ' quite so easy to say', w: 44, to: 'experiment.after.a' },
      { t: ' worth doing in the old way,', w: 34, to: 'experiment.after.b' },
      { t: ' hers alone,', w: 22, to: 'experiment.after.c' },
    ],
    'experiment.after.a': [
      { t: ' out loud in a lecture theatre.', w: 46, to: null },
      { t: ' with a straight face at a conference dinner.', w: 32, to: null },
      { t: ' about how careful the field had been.', w: 22, to: null },
    ],
    'experiment.after.b': [
      { t: ' though the old way had been good for forty years.', w: 45, to: null },
      { t: ' and everyone had built their instruments for the old way.', w: 33, to: null },
      { t: ' which nobody wanted to be the first to say.', w: 22, to: null },
    ],
    'experiment.after.c': [
      { t: ' which is a lonelier outcome than it sounds.', w: 47, to: null },
      { t: ' and she found she did not want it to be.', w: 31, to: null },
      { t: ' since the other two had left in the spring.', w: 22, to: null },
    ],

    /* --------------------------------------------------------------- explain */
    explain: [
      { t: ' not tonight.', w: 38, to: 'explain.tonight' },
      { t: ' every time she began,', w: 28, to: 'explain.began' },
      { t: ' what she explained was', w: 20, to: 'explain.what' },
      { t: ' by then I had', w: 14, to: 'explain.already' },
    ],
    'explain.tonight': [
      { t: ' Tonight there was the dinner,', w: 44, to: 'explain.tonight.a' },
      { t: ' There was never going to be', w: 35, to: 'explain.tonight.b' },
      { t: ' I said that was fine,', w: 21, to: 'explain.tonight.c' },
    ],
    'explain.tonight.a': [
      { t: ' and after the dinner there was the drive home.', w: 46, to: null },
      { t: ' and she was very good at dinners.', w: 32, to: null },
      { t: ' which she had arranged for exactly this reason.', w: 22, to: null },
    ],
    'explain.tonight.b': [
      { t: ' a night that was the right night.', w: 48, to: null },
      { t: ' an explanation, and we both knew the shape of that.', w: 30, to: null },
      { t: ' a version of it that did not cost her something.', w: 22, to: null },
    ],
    'explain.tonight.c': [
      { t: ' and meant it, which surprised us both.', w: 44, to: null },
      { t: ' in the voice that means it is not fine.', w: 34, to: null },
      { t: ' and went to bed, and slept badly.', w: 22, to: null },
    ],
    'explain.began': [
      { t: ' the phone rang,', w: 40, to: 'explain.began.a' },
      { t: ' she started somewhere', w: 36, to: 'explain.began.b' },
      { t: ' I found I did not want', w: 24, to: 'explain.began.c' },
    ],
    'explain.began.a': [
      { t: ' and she answered it, every time.', w: 47, to: null },
      { t: ' or the dog needed out, or the kettle went.', w: 31, to: null },
      { t: ' though I never once heard it ring.', w: 22, to: null },
    ],
    'explain.began.b': [
      { t: ' further back, and never got to the year in question.', w: 45, to: null },
      { t: ' new, so that nothing ever joined up.', w: 33, to: null },
      { t: ' in the middle, as if I already knew the first half.', w: 22, to: null },
    ],
    'explain.began.c': [
      { t: ' to hear the end of the sentence.', w: 46, to: null },
      { t: ' to be the kind of person who needed it.', w: 32, to: null },
      { t: ' her to have to say it in her own kitchen.', w: 22, to: null },
    ],
    'explain.what': [
      { t: ' not the thing I had asked about', w: 43, to: 'explain.what.a' },
      { t: ' true, and', w: 34, to: 'explain.what.b' },
      { t: ' shorter than', w: 23, to: 'explain.what.c' },
    ],
    'explain.what.a': [
      { t: ', and was better than the thing I had asked about.', w: 45, to: null },
      { t: ', and I did not notice for two days.', w: 33, to: null },
      { t: ' — it was the thing underneath it.', w: 22, to: null },
    ],
    'explain.what.b': [
      { t: ' explained nothing at all.', w: 48, to: null },
      { t: ' left the important part standing exactly where it was.', w: 30, to: null },
      { t: ' made every earlier account of it a lie.', w: 22, to: null },
    ],
    'explain.what.c': [
      { t: ' I had built room for, and stranger.', w: 46, to: null },
      { t: ' the silence that had come before it by four months.', w: 31, to: null },
      { t: ' a sentence, in the end. Six words.', w: 23, to: null },
    ],
    'explain.already': [
      { t: ' worked most of it out,', w: 42, to: 'explain.already.a' },
      { t: ' stopped needing to know,', w: 35, to: 'explain.already.b' },
      { t: ' told three people my own version,', w: 23, to: 'explain.already.c' },
    ],
    'explain.already.a': [
      { t: ' and got the important part wrong.', w: 47, to: null },
      { t: ' badly, and in the least generous order.', w: 31, to: null },
      { t: ' and wanted to hear it anyway, from her.', w: 22, to: null },
    ],
    'explain.already.b': [
      { t: ' which is not the same as forgiving it.', w: 46, to: null },
      { t: ' and that was its own small loss.', w: 32, to: null },
      { t: ' though I let her tell me regardless.', w: 22, to: null },
    ],
    'explain.already.c': [
      { t: ' and could not now take it back.', w: 48, to: null },
      { t: ' each one slightly kinder to me than the last.', w: 30, to: null },
      { t: ' and one of them had already told her.', w: 22, to: null },
    ],

    /* ----------------------------------------------------------------- river */
    river: [
      { t: ' nobody was to', w: 37, to: 'river.forbid' },
      { t: ' it belonged to', w: 29, to: 'river.owns' },
      { t: ' every house had to', w: 21, to: 'river.duty' },
      { t: ' it was not to be', w: 13, to: 'river.named' },
    ],
    'river.forbid': [
      { t: ' cross it after dark.', w: 45, to: 'river.forbid.a' },
      { t: ' take anything out of it,', w: 34, to: 'river.forbid.b' },
      { t: ' build within forty feet of it,', w: 21, to: 'river.forbid.c' },
    ],
    'river.forbid.a': [
      { t: ' The rule was older than the bridge and nobody amended it.', w: 46, to: null },
      { t: ' There were four bridges and all of them were lit.', w: 31, to: null },
      { t: ' The reason had been lost, and the rule had not.', w: 23, to: null },
    ],
    'river.forbid.b': [
      { t: ' including water, which made farming an argument.', w: 44, to: null },
      { t: ' though everyone did, and everyone knew everyone did.', w: 34, to: null },
      { t: ' and twice a year the council dredged it anyway.', w: 22, to: null },
    ],
    'river.forbid.c': [
      { t: ' which is why the old town stands in a horseshoe.', w: 47, to: null },
      { t: ' a rule three developers had tested and lost.', w: 31, to: null },
      { t: ' though the church had been there first and stayed.', w: 22, to: null },
    ],
    'river.owns': [
      { t: ' the city only in summer,', w: 43, to: 'river.owns.a' },
      { t: ' whoever could name', w: 33, to: 'river.owns.b' },
      { t: ' nobody, formally,', w: 24, to: 'river.owns.c' },
    ],
    'river.owns.a': [
      { t: ' and to the sea for the rest of the year.', w: 46, to: null },
      { t: ' when it was low enough to argue about.', w: 32, to: null },
      { t: ' a distinction that had started as a joke.', w: 22, to: null },
    ],
    'river.owns.b': [
      { t: ' all eleven of its bridges in order.', w: 45, to: null },
      { t: ' it correctly, and it had four names.', w: 33, to: null },
      { t: ' the fish in it, which nobody living could.', w: 22, to: null },
    ],
    'river.owns.c': [
      { t: ' which meant in practice it belonged to the barge families.', w: 47, to: null },
      { t: ' and this had been settled at some cost.', w: 31, to: null },
      { t: ' so the maps simply left it white.', w: 22, to: null },
    ],
    'river.duty': [
      { t: ' keep a rope by the door.', w: 44, to: 'river.duty.a' },
      { t: ' send someone to the spring flooding,', w: 34, to: 'river.duty.b' },
      { t: ' face it, however awkward the plot,', w: 22, to: 'river.duty.c' },
    ],
    'river.duty.a': [
      { t: ' Most were ornamental by then. All were checked.', w: 46, to: null },
      { t: ' Nobody could remember the last time one was used.', w: 32, to: null },
      { t: ' The ropes were inspected in October, like clocks.', w: 22, to: null },
    ],
    'river.duty.b': [
      { t: ' and the list of who had not come was read out in June.', w: 45, to: null },
      { t: ' which took three days and was the year’s only holiday.', w: 33, to: null },
      { t: ' though the flooding had stopped a generation ago.', w: 22, to: null },
    ],
    'river.duty.c': [
      { t: ' which is why the whole city looks slightly turned.', w: 48, to: null },
      { t: ' and the two that did not were bought and demolished.', w: 30, to: null },
      { t: ' so that every kitchen window has water in it.', w: 22, to: null },
    ],
    'river.named': [
      { t: ' spoken of in winter,', w: 42, to: 'river.named.a' },
      { t: ' called by its name', w: 35, to: 'river.named.b' },
      { t: ' drawn on anything,', w: 23, to: 'river.named.c' },
    ],
    'river.named.a': [
      { t: ' a rule everyone kept without ever agreeing to it.', w: 47, to: null },
      { t: ' which made the winter council meetings very short.', w: 31, to: null },
      { t: ' and in winter the city talked instead about the weather.', w: 22, to: null },
    ],
    'river.named.b': [
      { t: ' by anyone born outside the parish.', w: 45, to: null },
      { t: ' after dark, and it had a name, and everyone knew it.', w: 33, to: null },
      { t: ' in the presence of children.', w: 22, to: null },
    ],
    'river.named.c': [
      { t: ' so the city maps show a blank running through them.', w: 49, to: null },
      { t: ' which the surveyors solved by drawing it as a road.', w: 29, to: null },
      { t: ' and the rule outlived the invention of photography by nine years.', w: 22, to: null },
    ],

    /* ------------------------------------------------------------------ list */
    list: [
      { t: ' done.', w: 35, to: 'list.done' },
      { t: ' said out loud,', w: 30, to: 'list.said' },
      { t: ' been forgiven for,', w: 22, to: 'list.forgiven' },
      { t: ' understood about', w: 13, to: 'list.understood' },
    ],
    'list.done': [
      { t: ' It ran to four pages and', w: 43, to: 'list.done.a' },
      { t: ' Most of it was ordinary —', w: 34, to: 'list.done.b' },
      { t: ' He added to it more readily than', w: 23, to: 'list.done.c' },
    ],
    'list.done.a': [
      { t: ' he had done none of it by the end.', w: 46, to: null },
      { t: ' item one was learn to swim.', w: 32, to: null },
      { t: ' he revised it every January without crossing anything off.', w: 22, to: null },
    ],
    'list.done.b': [
      { t: ' ridden a horse, been to Spain, held a job for a year.', w: 45, to: null },
      { t: ' and the ordinary items were the ones that stung.', w: 33, to: null },
      { t: ' broken a bone, missed a train, lost anything that mattered.', w: 22, to: null },
    ],
    'list.done.c': [
      { t: ' he did anything else at all.', w: 47, to: null },
      { t: ' he spoke, which his sister found unbearable.', w: 31, to: null },
      { t: ' he added to the list of things he had.', w: 22, to: null },
    ],
    'list.said': [
      { t: ' beginning with', w: 44, to: 'list.said.a' },
      { t: ' though he had written all of them', w: 33, to: 'list.said.b' },
      { t: ' and the list was the saying,', w: 23, to: 'list.said.c' },
    ],
    'list.said.a': [
      { t: ' the obvious one, which he had put at number nine.', w: 46, to: null },
      { t: ' his own name in a room with his father in it.', w: 32, to: null },
      { t: ' the word he had used in his head for thirty years.', w: 22, to: null },
    ],
    'list.said.b': [
      { t: ' down, some of them more than once.', w: 45, to: null },
      { t: ' in letters he did not post.', w: 33, to: null },
      { t: ' and read them back in the voice he would have used.', w: 22, to: null },
    ],
    'list.said.c': [
      { t: ' which he did not think of as a substitution.', w: 48, to: null },
      { t: ' or was meant to be, and was not.', w: 30, to: null },
      { t: ' and he kept it where it would be found.', w: 22, to: null },
    ],
    'list.forgiven': [
      { t: ' which was shorter than', w: 45, to: 'list.forgiven.a' },
      { t: ' and one entry appeared', w: 33, to: 'list.forgiven.b' },
      { t: ' though nobody had ever', w: 22, to: 'list.forgiven.c' },
    ],
    'list.forgiven.a': [
      { t: ' the other list, and heavier.', w: 47, to: null },
      { t: ' he expected, and did not include the thing he assumed.', w: 31, to: null },
      { t: ' one line, and had been there since he was nineteen.', w: 22, to: null },
    ],
    'list.forgiven.b': [
      { t: ' on both lists, which he had never noticed.', w: 46, to: null },
      { t: ' four times, in four different hands.', w: 32, to: null },
      { t: ' without a name attached to it.', w: 22, to: null },
    ],
    'list.forgiven.c': [
      { t: ' asked him for anything of the kind.', w: 48, to: null },
      { t: ' told him he needed to be.', w: 30, to: null },
      { t: ' said the word to him in his life.', w: 22, to: null },
    ],
    'list.understood': [
      { t: ' his mother,', w: 43, to: 'list.understood.a' },
      { t: ' money, which he treated as', w: 34, to: 'list.understood.b' },
      { t: ' why people stayed,', w: 23, to: 'list.understood.c' },
    ],
    'list.understood.a': [
      { t: ' who was on the other list twice.', w: 46, to: null },
      { t: ' and who had kept a similar list, found later.', w: 32, to: null },
      { t: ' though he could predict her exactly.', w: 22, to: null },
    ],
    'list.understood.b': [
      { t: ' weather — real, arriving, nobody’s fault.', w: 45, to: null },
      { t: ' a language spoken fluently by everyone but him.', w: 33, to: null },
      { t: ' something that happened to other people on purpose.', w: 22, to: null },
    ],
    'list.understood.c': [
      { t: ' having never once been the one who left.', w: 47, to: null },
      { t: ' or how they decided the moment they would not.', w: 31, to: null },
      { t: ' which he had put last and underlined.', w: 22, to: null },
    ],

    /* -------------------------------------------------------------- counting */
    counting: [
      { t: ' the answer no longer', w: 36, to: 'counting.moot' },
      { t: ' three of us were still', w: 29, to: 'counting.waiting' },
      { t: ' it had counted', w: 21, to: 'counting.what' },
      { t: ' nobody could say what', w: 14, to: 'counting.meaning' },
    ],
    'counting.moot': [
      { t: ' mattered to anyone', w: 44, to: 'counting.moot.a' },
      { t: ' fit on the paper', w: 33, to: 'counting.moot.b' },
      { t: ' agreed with the question', w: 23, to: 'counting.moot.c' },
    ],
    'counting.moot.a': [
      { t: ' outside the room, and barely to us.', w: 46, to: null },
      { t: ' who had commissioned it, all of whom had moved on.', w: 32, to: null },
      { t: ' living, which we agreed was not the same as being useless.', w: 22, to: null },
    ],
    'counting.moot.b': [
      { t: ' we had brought, or on any paper made.', w: 45, to: null },
      { t: ' and had to be described rather than written.', w: 33, to: null },
      { t: ' though the first eleven digits did, and were enough.', w: 22, to: null },
    ],
    'counting.moot.c': [
      { t: ' we had started with, which had drifted while it ran.', w: 47, to: null },
      { t: ' in form but not in units.', w: 31, to: null },
      { t: ' anyone remembered asking.', w: 22, to: null },
    ],
    'counting.waiting': [
      { t: ' in the building,', w: 45, to: 'counting.waiting.a' },
      { t: ' employed,', w: 32, to: 'counting.waiting.b' },
      { t: ' alive to see it,', w: 23, to: 'counting.waiting.c' },
    ],
    'counting.waiting.a': [
      { t: ' and one of us was asleep.', w: 46, to: null },
      { t: ' though only one of us had been there at the start.', w: 32, to: null },
      { t: ' out of eleven who had signed the original memorandum.', w: 22, to: null },
    ],
    'counting.waiting.b': [
      { t: ' which the funding body considered a success.', w: 47, to: null },
      { t: ' and two of those were on the last month of a contract.', w: 31, to: null },
      { t: ' though not by the department that had asked the question.', w: 22, to: null },
    ],
    'counting.waiting.c': [
      { t: ' and the one who had wanted it most was not.', w: 48, to: null },
      { t: ' which we had not thought would be the hard part.', w: 30, to: null },
      { t: ' and none of us could read it without her.', w: 22, to: null },
    ],
    'counting.what': [
      { t: ' something,', w: 43, to: 'counting.what.a' },
      { t: ' everything twice', w: 34, to: 'counting.what.b' },
      { t: ' further than', w: 23, to: 'counting.what.c' },
    ],
    'counting.what.a': [
      { t: ' though not the thing we had pointed it at.', w: 46, to: null },
      { t: ' and it had counted it correctly, which we could prove.', w: 32, to: null },
      { t: ' and would not say what, and had never been asked to.', w: 22, to: null },
    ],
    'counting.what.b': [
      { t: ' and disagreed with itself by one.', w: 47, to: null },
      { t: ', which was not what we asked for but was more useful.', w: 31, to: null },
      { t: ' for reasons buried in code nobody had touched since 2011.', w: 22, to: null },
    ],
    'counting.what.c': [
      { t: ' the question went, and kept going.', w: 45, to: null },
      { t: ' anything we had a name for.', w: 33, to: null },
      { t: ' we had funding to check.', w: 22, to: null },
    ],
    'counting.meaning': [
      { t: ' the number was a number', w: 44, to: 'counting.meaning.a' },
      { t: ' we would do', w: 33, to: 'counting.meaning.b' },
      { t: ' it had been like', w: 23, to: 'counting.meaning.c' },
    ],
    'counting.meaning.a': [
      { t: ' of, and it did not seem to matter that we could not.', w: 46, to: null },
      { t: ' of, which is a strange thing to publish.', w: 32, to: null },
      { t: ' of, so we named it after the machine.', w: 22, to: null },
    ],
    'counting.meaning.b': [
      { t: ' with it, so we did nothing, and it stood.', w: 47, to: null },
      { t: ' next, and the machine had no opinion.', w: 31, to: null },
      { t: ' if it had come out the other way.', w: 22, to: null },
    ],
    'counting.meaning.c': [
      { t: ' for the machine, which is not a real question, and we asked it.', w: 45, to: null },
      { t: ' inside the eleven years it took.', w: 33, to: null },
      { t: ' to be the last generation that had to wait.', w: 22, to: null },
    ],
  },
};

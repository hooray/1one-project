#!/usr/bin/env node

// 处理用户输入的命令
const program = require('commander');
// 下载模板
const download = require('download-git-repo');
// 问题交互
const inquirer = require('inquirer');
// node 文件模块
const fs = require('fs');
// 填充信息至文件
const handlebars = require('handlebars');
// 动画效果
const ora = require('ora');
// 字体加颜色
const chalk = require('chalk');
// 显示提示图标
const symbols = require('log-symbols');
// 命令行操作
const shell = require('shelljs');
// 模版git地址
const gitRepo = {
    jQuery: 'hooray/gulp-automation-template',
    Vue: 'hooray/vue-automation-template'
};
const package = require('./package.json');

program
    .version(package.version, '-v, --version')
    .command('init [name]')
    .action(name => {
        let gitRepoList = [];
        for (let i in gitRepo) {
            gitRepoList.push(i);
        }
        inquirer
            .prompt([
                {
                    type: 'input',
                    message: '请输入项目名',
                    name: 'name',
                    default: name,
                    validate: function(val) {
                        if (val == '') {
                            return '项目必须要有名称噢';
                        }
                        if (fs.existsSync(val)) {
                            return '项目名已存在';
                        }
                        return true;
                    }
                },
                {
                    type: 'list',
                    message: '请选择项目类型',
                    name: 'type',
                    choices: gitRepoList
                },
				{
					type: 'confirm',
					message: '是否初始化 git 仓库',
					name: 'ifGitInit',
					default: true
				},
                {
                    type: 'confirm',
                    message: '下载完成是否自动安装依赖包',
                    name: 'ifInstall',
                    default: true
                },
                {
                    type: 'list',
                    message: '请选择安装方式',
                    name: 'installWay',
                    choices: ['yarn', 'npm'],
                    when: answers => {
                        return answers.ifInstall;
                    }
				}
            ])
            .then(answers => {
                let spinner = ora('下载中...');
                spinner.start();
                download(gitRepo[answers.type], answers.name, err => {
                    if (err) {
                        spinner.fail();
                        console.log(symbols.error, chalk.red('项目创建失败'));
                    } else {
                        spinner.succeed();
                        console.log(symbols.success, chalk.green('项目创建成功'));
                        const packageFile = `${answers.name}/package.json`;
                        if (fs.existsSync(packageFile)) {
                            const content = fs
                                .readFileSync(packageFile)
                                .toString();
                            const result = handlebars.compile(content)({
                                name: answers.name
                            });
                            fs.writeFileSync(packageFile, result);
                        }
						fs.unlink(`${answers.name}/readme.md`, () => {});
						if (answers.ifGitInit) {
							shell
								.cd(answers.name)
								.exec('git init', err => {
									if (err) {
										console.log(symbols.error, chalk.red(err));
									} else {
										console.log(symbols.success, chalk.green('git 仓库初始化成功'));
									}
								});
						}
                        if (answers.ifInstall) {
                            let spinner = ora('安装中...');
                            spinner.start();
                            shell
                                .cd(answers.name)
                                .exec(
                                    `${answers.installWay == 'yarn' ? 'yarn' : 'npm i'}`,
                                    err => {
                                        if (err) {
                                            spinner.fail();
                                            console.log(symbols.error, chalk.red(err));
                                        } else {
                                            spinner.succeed();
                                            console.log(symbols.success, chalk.green('依赖包安装成功'));
                                        }
                                    }
                                );
                        }
                    }
                });
            });
    });
program.parse(process.argv);
